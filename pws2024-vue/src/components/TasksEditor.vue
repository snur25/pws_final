<script>
const taskEndpoint = "/api/task";
const personEndpoint = "/api/person";

export default {
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
    };
  },
  props: ["task"],
  emits: ["close"],
  methods: {
    send() {
      fetch(taskEndpoint, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(this.input),
      }).then((res) => {
        res
          .json()
          .then((data) => {
            if (!res.ok) {
              this.$emit("close");
            } else {
              this.input = {};
              this.$emit("close");
            }
          })
          .catch((err) => {
            this.$emit("close");
          });
      });
    },
    update() {
      fetch(taskEndpoint, {
        method: "PUT",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(this.input),
      }).then((res) => {
        res
          .json()
          .then((data) => {
            if (!res.ok) {
              this.$emit("close");
            } else {
              this.input = {};
              this.$emit("close");
            }
          })
          .catch((err) => {
            this.$emit("close");
          });
      });
    },
    remove() {
      fetch(taskEndpoint + "?" + new URLSearchParams({ _id: this.input._id }), {
        method: "DELETE",
      }).then((res) => {
        res
          .json()
          .then((data) => {
            if (!res.ok) {
              this.$emit("close");
            } else {
              this.input = {};
              this.$emit("close");
            }
          })
          .catch((err) => {
            this.$emit("close");
          });
      });
    },
    close() {
      this.$emit("close");
    },
    clear() {
      this.input = { project_id: this.task.project_id };
    },
  },
  mounted() {
    this.input = this.task ? { ...this.task } : {};

    fetch(
      personEndpoint +
        "?" +
        new URLSearchParams({ sort: "lastName", order: 1 }).toString()
    ).then((res) =>
      res.json().then((facet) => {
        this.personItems = facet.data;
      })
    );
  },
};
</script>

<template>
  <v-form v-model="isValid">
    <v-card>
      <v-card-title>{{ input._id ? "Edit task" : "Add task" }}</v-card-title>
      <v-card-subtitle>
        {{ input._id || "new task" }}
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
  </v-form>
</template>

<style scoped></style>
