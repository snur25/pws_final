const uuid = require("uuid");
const mongoose = require("mongoose");

const task = (module.exports = {
  model: null,
  endpoint: "/api/task",
  wsInstance: null, // This will be set by server.js
  init: (conn) => {
    task.schema = new mongoose.Schema(
      {
        _id: { type: String, default: uuid.v4 },
        project_id: { type: String, required: true },
        name: {
          type: String,
          required: true,
          validate: {
            validator: (v) => {
              return /^\p{L}/u.test(v);
            },
            message: (props) => `${props.value} does not start from a letter`,
          },
        },
        startDate: {
          type: Date,
          required: true,
          transform: (v) => v.toISOString().substr(0, 10),
        },
        endDate: {
          type: Date,
          required: false,
          transform: (v) => v.toISOString().substr(0, 10),
        },
        contractor_ids: { type: [String], required: false, default: [] },
      },
      {
        versionKey: false,
        additionalProperties: false,
      }
    );
    task.model = conn.model("Task", task.schema);
  },
  schema: null,
  get: (req, res) => {
    let sort = {};
    if (req.query.sort) {
      sort[req.query.sort] = +req.query.order || 1;
    }

    const matchCriteria = {
      name: { $regex: req.query.search || "", $options: "i" }
    };

    // Add project_id to matching criteria if provided
    if (req.query.project_id) {
      matchCriteria.project_id = req.query.project_id;
    }

    const matching = { $match: matchCriteria };

    const aggregation = [matching];

    if (req.query.sort) {
      aggregation.push({ $sort: sort });
    }
    aggregation.push({ $skip: +req.query.skip || 0 });
    let limit = +req.query.limit;
    if (!isNaN(limit) && limit > 0) {
      aggregation.push({ $limit: limit });
    }
    
    task.model
      .aggregate([
        {
          $facet: {
            total: [matching, { $count: "count" }],
            data: aggregation,
          },
        },
      ])
      .then((facet) => {
        [facet] = facet;
        facet.total =
          (facet.total && facet.total[0] ? facet.total[0].count : 0) || 0;
        facet.data = facet.data.map((item) => new task.model(item).toObject());
        res.json(facet);
      })
      .catch((err) => {
        res.status(400).json({ error: err.message });
      });
  },
  post: (req, res) => {
    let item = new task.model(req.body);
    let err = item.validateSync();
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    item
      .save()
      .then((row) => {
        // Broadcast task update
        if (task.wsInstance && task.wsInstance.broadcast) {
          task.wsInstance.broadcast({
            type: 'update',
            entity: 'task',
            action: 'create',
            taskId: row._id,
            projectId: row.project_id
          });
        }
        res.json(row);
      })
      .catch((err) => {
        res.status(400).json({ error: err.message });
      });
  },
  put: (req, res) => {
    let _id = req.body._id;
    if (!_id) {
      res.status(400).json({ error: "no _id!" });
      return;
    }
    const projectId = req.body.project_id;
    delete req.body._id;
    task.model
      .findOneAndUpdate(
        { _id },
        { $set: req.body },
        { new: true, runValidators: true }
      )
      .then((row) => {
        // Broadcast task update
        if (task.wsInstance && task.wsInstance.broadcast) {
          task.wsInstance.broadcast({
            type: 'update',
            entity: 'task',
            action: 'update',
            taskId: _id,
            projectId: projectId || row.project_id
          });
        }
        res.json(row);
      })
      .catch((err) => {
        res.status(400).json({ error: err.message });
      });
  },
  delete: (req, res) => {
    let _id = req.query._id;
    if (!_id) {
      res.status(400).json({ error: "no _id!" });
      return;
    }
    
    // First, get the task to retrieve the project_id
    task.model.findOne({ _id })
      .then(taskDoc => {
        if (!taskDoc) {
          res.status(404).json({ error: "Task not found" });
          return;
        }
        
        const projectId = taskDoc.project_id;
        
        // Now delete the task
        return task.model.findOneAndDelete({ _id })
          .then((row) => {
            // Broadcast task update
            if (task.wsInstance && task.wsInstance.broadcast) {
              task.wsInstance.broadcast({
                type: 'update',
                entity: 'task',
                action: 'delete',
                taskId: _id,
                projectId: projectId
              });
            }
            res.json(row);
          });
      })
      .catch((err) => {
        res.status(400).json({ error: err.message });
      });
  },
});