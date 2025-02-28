<script>
import TaskEditor from "./TasksEditor.vue";

const taskEndpoint = "/api/task";

export default {
  components: {
    TaskEditor
  },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  emits: ["close"],
  data() {
    return {
      tasks: [],
      showEditor: false,
      selectedTask: null
    };
  },
  methods: {
    loadTasks() {
      fetch(`${taskEndpoint}?${new URLSearchParams({ project_id: this.projectId }).toString()}`)
        .then(response => response.json())
        .then(data => {
          if (data.data) {
            this.tasks = data.data;
          }
        })
        .catch(error => {
          console.error("Error loading tasks:", error);
        });
    },
    editTask(task) {
      this.selectedTask = { ...task };
      this.showEditor = true;
    },
    addTask() {
      this.selectedTask = { 
        project_id: this.projectId,
        contractor_ids: []
      };
      this.showEditor = true;
    },
    closeEditor() {
      this.showEditor = false;
      this.selectedTask = null;
      this.loadTasks();
    },
    formatDate(dateString) {
      if (!dateString) return "Not completed";
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
    close() {
      this.$emit("close");
    }
  },
  watch: {
    projectId: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.loadTasks();
        }
      }
    }
  }
};
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      Tasks
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="addTask">Add Task</v-btn>
    </v-card-title>
    
    <v-card-text>
      <v-table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task._id">
            <td>{{ task.name }}</td>
            <td>{{ formatDate(task.startDate) }}</td>
            <td>{{ formatDate(task.endDate) }}</td>
            <td>
              <v-chip
                :color="task.endDate ? 'success' : 'warning'"
                text-color="white"
              >
                {{ task.endDate ? "Completed" : "In Progress" }}
              </v-chip>
            </td>
            <td>
              <v-btn size="small" color="primary" @click="editTask(task)">Edit</v-btn>
            </td>
          </tr>
          <tr v-if="tasks.length === 0">
            <td colspan="5" class="text-center">No tasks found for this project</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
    
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="close">Close</v-btn>
    </v-card-actions>

    <v-dialog v-model="showEditor" width="500px">
      <TaskEditor
        v-if="showEditor"
        :task="selectedTask"
        @close="closeEditor"
      />
    </v-dialog>
  </v-card>
</template>