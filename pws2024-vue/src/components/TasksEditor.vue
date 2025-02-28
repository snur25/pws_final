<script>
const taskEndpoint = "/api/task";
const personEndpoint = "/api/person";

export default {
  props: {
    task: {
      type: Object,
      required: true
    }
  },
  emits: ["close"],
  data() {
    return {
      personItems: [],
      isValid: false,
      input: {
        name: "",
        startDate: "",
        endDate: "",
        contractor_ids: [],
        project_id: ""
      },
      rules: {
        startsWithLetter: value => {
          if (!value) return "Field is required";
          const pattern = /^\p{L}/u;
          return pattern.test(value) || "Name should start with a letter";
        },
        validDate: value => {
          if (!value) return "Date is required";
          return !!value || "Date is required";
        }
      }
    };
  },
  methods: {
    send() {
      const taskData = { ...this.input };
      
      // Format dates properly for API
      if (taskData.startDate) {
        const startDate = new Date(taskData.startDate);
        if (!isNaN(startDate.getTime())) {
          taskData.startDate = startDate.toISOString();
        }
      }
      
      if (taskData.endDate) {
        const endDate = new Date(taskData.endDate);
        if (!isNaN(endDate.getTime())) {
          taskData.endDate = endDate.toISOString();
        }
      }
      
      fetch(taskEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      })
        .then(response => response.json())
        .then(data => {
          if (!data.error) {
            this.$emit("close");
          } else {
            console.error("Error creating task:", data.error);
          }
        })
        .catch(error => {
          console.error("Error:", error);
          this.$emit("close");
        });
    },
    update() {
      const taskData = { ...this.input };
      
      // Format dates properly for API
      if (taskData.startDate) {
        const startDate = new Date(taskData.startDate);
        if (!isNaN(startDate.getTime())) {
          taskData.startDate = startDate.toISOString();
        }
      }
      
      if (taskData.endDate) {
        const endDate = new Date(taskData.endDate);
        if (!isNaN(endDate.getTime())) {
          taskData.endDate = endDate.toISOString();
        }
      }
      
      fetch(taskEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      })
        .then(response => response.json())
        .then(data => {
          if (!data.error) {
            this.$emit("close");
          } else {
            console.error("Error updating task:", data.error);
          }
        })
        .catch(error => {
          console.error("Error:", error);
          this.$emit("close");
        });
    },
    remove() {
      if (!this.input._id) {
        this.$emit("close");
        return;
      }
      
      fetch(`${taskEndpoint}?${new URLSearchParams({ _id: this.input._id }).toString()}`, {
        method: "DELETE"
      })
        .then(response => response.json())
        .then(data => {
          if (!data.error) {
            this.$emit("close");
          } else {
            console.error("Error deleting task:", data.error);
          }
        })
        .catch(error => {
          console.error("Error:", error);
          this.$emit("close");
        });
    },
    close() {
      this.$emit("close");
    },
    clear() {
      // Keep only the project_id
      const project_id = this.input.project_id;
      this.input = {
        project_id,
        name: "",
        startDate: "",
        endDate: "",
        contractor_ids: []
      };
    },
    formatDateForInput(dateString) {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().substring(0, 10);
      } catch (e) {
        return "";
      }
    }
  },
  mounted() {
    // Initialize input with task data
    this.input = {
      ...this.task,
      startDate: this.formatDateForInput(this.task.startDate),
      endDate: this.formatDateForInput(this.task.endDate),
      contractor_ids: this.task.contractor_ids || []
    };
    
    // Load person data for contractor selection
    fetch(`${personEndpoint}?${new URLSearchParams({ sort: "lastName", order: 1 }).toString()}`)
      .then(response => response.json())
      .then(data => {
        if (data.data) {
          this.personItems = data.data;
        }
      })
      .catch(error => {
        console.error("Error loading persons:", error);
      });
  }
};
</script>

<template>
  <v-form v-model="isValid">
    <v-card>
      <v-card-title>{{ input._id ? "Edit Task" : "Add Task" }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="input.name"
          label="Name"
          variant="outlined"
          :rules="[rules.startsWithLetter]"
          required
        ></v-text-field>
        
        <v-text-field
          v-model="input.startDate"
          label="Start Date"
          type="date"
          variant="outlined"
          :rules="[rules.validDate]"
          required
        ></v-text-field>
        
        <v-text-field
          v-model="input.endDate"
          label="End Date (leave empty if not completed)"
          type="date"
          variant="outlined"
        ></v-text-field>
        
        <v-autocomplete
          v-model="input.contractor_ids"
          :items="personItems"
          item-value="_id"
          :item-title="item => `${item.firstName} ${item.lastName}`"
          label="Workers"
          multiple
          chips
          variant="outlined"
        ></v-autocomplete>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="clear">Clear</v-btn>
        <v-btn color="primary" @click="send" :disabled="!isValid" v-if="!input._id">Save</v-btn>
        <v-btn color="primary" @click="update" :disabled="!isValid" v-if="input._id">Update</v-btn>
        <v-btn color="error" @click="remove" v-if="input._id">Delete</v-btn>
        <v-btn @click="close">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>