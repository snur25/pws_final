<script>
import Tasks from "./Tasks.vue";

const projectEndpoint = "/api/project";
const personEndpoint = "/api/person";

export default {
  components: {
    Tasks,
  },
  data() {
    return {
      personItems: [],
      isValid: false,
      input: {},
      rules: {
        startsWithLetter: (value) => {
          const pattern = /^\p{L}/u;
          return pattern.test(value) || "It should start with a letter";
        },
        validDate: (value) => {
          const date = new Date(value);
          return !!date || "Use a proper date";
        },
      },
      tasksDialog: false,
    };
  },
  props: ["project", "persons"],
  emits: ["close", "listChanged"],
  methods: {
    send() {
      // Format dates properly for API
      const projectData = { ...this.input };
      
      if (projectData.startDate) {
        const startDate = new Date(projectData.startDate);
        if (!isNaN(startDate.getTime())) {
          projectData.startDate = startDate.toISOString();
        }
      }
      
      if (projectData.endDate) {
        const endDate = new Date(projectData.endDate);
        if (!isNaN(endDate.getTime())) {
          projectData.endDate = endDate.toISOString();
        }
      }
      
      fetch(projectEndpoint, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(projectData),
      }).then((res) => {
        res
          .json()
          .then((data) => {
            if(!res.ok) {
              this.$emit("close", data.error, "error");
            } else {
              this.$emit("close", `Project ${data.name} - added`);
              this.$emit("listChanged");
            }
          })
          .catch((err) => {
            this.$emit("close", "Data discarded", "error");
          });
      });
    },
    update() {
      // Format dates properly for API
      const projectData = { ...this.input };
      
      if (projectData.startDate) {
        const startDate = new Date(projectData.startDate);
        if (!isNaN(startDate.getTime())) {
          projectData.startDate = startDate.toISOString();
        }
      }
      
      if (projectData.endDate) {
        const endDate = new Date(projectData.endDate);
        if (!isNaN(endDate.getTime())) {
          projectData.endDate = endDate.toISOString();
        }
      }
      
      fetch(projectEndpoint, {
        method: "PUT",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(projectData),
      }).then((res) => {
        res
          .json()
          .then((data) => {
            if(!res.ok) {
              this.$emit("close", data.error, "error");
            } else {
              this.$emit("close", `Project ${data.name} - updated`);
              this.$emit("listChanged");
            }
          })
          .catch((err) => {
            this.$emit("close", "Data discarded", "error");
          });
      });
    },
    remove() {
      fetch(
        projectEndpoint + "?" + new URLSearchParams({ _id: this.input._id }),
        {
          method: "DELETE",
        }
      ).then((res) => {
        res
          .json()
          .then((data) => {
            if(!res.ok) {
              this.$emit("close", data.error, "error");
            } else {
              this.$emit("close", `Project ${data.name} - deleted`);
              this.$emit("listChanged");
            }
          })
          .catch((err) => {
            this.$emit("close", "Data discarded", "error");
          });
      });
    },
    clear() {
      this.input = { _id: this.input._id };
      this.isValid = false;
    },
    close() {
      this.$emit("close");
    },
    showTasks() {
      this.tasksDialog = true;
    },
    closeTasks() {
      this.tasksDialog = false;
      this.$emit("listChanged");
    },
    formatDateForInput(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().substring(0, 10);
      } catch (e) {
        return '';
      }
    }
  },
  mounted() {
    // Make a copy of the project and format dates for input fields
    this.input = { ...this.project };
    
    if (this.input.startDate) {
      this.input.startDate = this.formatDateForInput(this.input.startDate);
    }
    
    if (this.input.endDate) {
      this.input.endDate = this.formatDateForInput(this.input.endDate);
    }
    
    // Ensure contractor_ids is an array
    if (!Array.isArray(this.input.contractor_ids)) {
      this.input.contractor_ids = [];
    }
    
    // Load persons if not provided via props
    if (!this.persons || this.persons.length === 0) {
      fetch(
        personEndpoint +
          "?" +
          new URLSearchParams({ sort: "lastName", order: 1 }).toString()
      ).then((res) =>
        res.json().then((facet) => {
          this.personItems = facet.data;
        })
      );
    } else {
      this.personItems = this.persons;
    }
  },
};
</script>

<template>
  <v-form v-model="isValid">
    <v-card>
      <v-card-title>{{ input._id ? "Edit data" : "Add data" }}</v-card-title>
      <v-card-subtitle>
        {{ input._id || "new project" }}
      </v-card-subtitle>
      <v-card-text>
        <v-text-field
          variant="outlined"
          label="Name"
          v-model="input.name"
          :rules="[rules.startsWithLetter]"
        >
        </v-text-field>
        <v-text-field
          type="date"
          variant="outlined"
          label="Start date"
          v-model="input.startDate"
          :rules="[rules.validDate]"
        >
        </v-text-field>
        <v-text-field
          type="date"
          variant="outlined"
          label="End date"
          v-model="input.endDate"
          :rules="[rules.validDate]"
        >
        </v-text-field>
        <v-autocomplete
          variant="outlined"
          v-model="input.contractor_ids"
          chips
          label="Contractors"
          multiple
          :items="personItems"
          :item-title="(item) => item.firstName + ' ' + item.lastName"
          item-value="_id"
        ></v-autocomplete>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          color="info"
          variant="elevated"
          @click="showTasks"
          v-if="input._id"
          >Tasks</v-btn
        >

        <v-btn variant="elevated" @click="clear">Clear</v-btn>

        <v-btn
          color="primary"
          variant="elevated"
          @click="send"
          :disabled="!isValid"
          v-if="!input._id"
          >Save</v-btn
        >
        <v-btn
          color="secondary"
          variant="elevated"
          @click="update"
          :disabled="!isValid"
          v-if="input._id"
          >Update</v-btn
        >
        <v-btn color="error" variant="elevated" @click="remove" v-if="input._id"
          >Delete</v-btn
        >
        <v-btn variant="elevated" @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="tasksDialog" width="800px">
      <Tasks 
        v-if="tasksDialog" 
        :projectId="input._id" 
        @close="closeTasks" 
      />
    </v-dialog>
  </v-form>
</template>

<style scoped></style>