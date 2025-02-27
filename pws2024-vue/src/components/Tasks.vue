<script>
import TasksEditor from "./TasksEditor.vue";

const taskEndpoint = "/api/task";

export default {
  components: {
    TasksEditor,
  },
  data() {
    return {
      tasks: [],
      headers: [
        { title: "Name", key: "name" },
        { title: "Start Date", key: "startDate" },
        { title: "End Date", key: "endDate" },
        { title: "Actions", key: "actions", sortable: false },
      ],
      showEditor: false,
      selectedTask: null,
    };
  },
  props: {
    projectId: String,
  },
  emits: ["close"],
  watch: {
    projectId: {
      handler() {
        this.loadTasks();
      },
      immediate: true,
    },
  },
  methods: {
    loadTasks() {
      fetch(
        taskEndpoint + "?" + new URLSearchParams({ project_id: this.projectId })
      )
        .then((res) => res.json())
        .then((data) => {
          this.tasks = data.data;
        });
    },
    editTask(task) {
      this.selectedTask = task;
      this.showEditor = true;
    },
    addTask() {
      this.selectedTask = { project_id: this.projectId };
      this.showEditor = true;
    },
    closeEditor() {
      this.showEditor = false;
      this.selectedTask = null;
      this.loadTasks();
    },
    close() {
      this.$emit("close");
    },
  },
  mounted() {
    this.loadTasks();
  },
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
            <th v-for="header in headers" :key="header.key">
              {{ header.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task._id">
            <td>{{ task.name }}</td>
            <td>{{ task.startDate }}</td>
            <td>{{ task.endDate }}</td>
            <td>
              <v-btn @click="editTask(task)">Edit</v-btn>
            </td>
            <td :class="{ 'completed-task': !task.endDate }">Completed</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="close">Close</v-btn>
    </v-card-actions>

    <v-dialog v-model="showEditor" width="1000px">
      <TasksEditor
        v-if="showEditor"
        :task="selectedTask"
        @close="closeEditor"
      />
    </v-dialog>
  </v-card>
</template>

<style scoped>
.completed-task {
  display: none;
}
</style>
