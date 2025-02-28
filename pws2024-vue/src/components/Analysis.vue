<script>
import common from '../mixins/common';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent]);

const projectEndpoint = '/api/project';
const taskEndpoint = '/api/task';

export default {
  props: ['session'],
  emits: ['display-message'],
  mixins: [common],
  components: { VChart },
  data() {
    return {
      projects: [],
      selectedProject: null,
      projectGanttOptions: {
        title: {
          text: 'Projects Gantt Chart'
        },
        tooltip: {
          trigger: 'axis',
          formatter: function (params) {
            const data = params[0].data;
            return `${data.name}<br/>
                   Start: ${new Date(data.start).toLocaleDateString()}<br/>
                   ${data.end ? 'End: ' + new Date(data.end).toLocaleDateString() : 'Ongoing'}<br/>
                   Status: ${data.status}`;
          }
        },
        grid: {
          height: '70%',
          top: '10%'
        },
        xAxis: {
          type: 'time',
          axisLabel: {
            formatter: '{MMM dd, yyyy}'
          }
        },
        yAxis: {
          type: 'category',
          data: [],
          axisLabel: {
            formatter: function (value) {
              return value.length > 20 ? value.substring(0, 20) + '...' : value;
            }
          }
        },
        series: [
          {
            type: 'bar',
            data: [],
            itemStyle: {
              color: function (params) {
                // Green for completed, blue for ongoing
                return params.data.status === 'Completed' ? '#91cc75' : '#5470c6';
              }
            }
          }
        ]
      },
      taskGanttOptions: {
        title: {
          text: 'Tasks Gantt Chart'
        },
        tooltip: {
          trigger: 'axis',
          formatter: function (params) {
            const data = params[0].data;
            return `${data.name}<br/>
                   Start: ${new Date(data.start).toLocaleDateString()}<br/>
                   ${data.end ? 'End: ' + new Date(data.end).toLocaleDateString() : 'Ongoing'}<br/>
                   Status: ${data.status}`;
          }
        },
        grid: {
          height: '70%',
          top: '10%'
        },
        xAxis: {
          type: 'time',
          axisLabel: {
            formatter: '{MMM dd, yyyy}'
          }
        },
        yAxis: {
          type: 'category',
          data: [],
          axisLabel: {
            formatter: function (value) {
              return value.length > 20 ? value.substring(0, 20) + '...' : value;
            }
          }
        },
        series: [
          {
            type: 'bar',
            data: [],
            itemStyle: {
              color: function (params) {
                // Green for completed, blue for ongoing
                return params.data.status === 'Completed' ? '#91cc75' : '#5470c6';
              }
            }
          }
        ]
      },
      websocket: null
    };
  },
  methods: {
    loadProjects() {
      fetch(projectEndpoint + '?' + new URLSearchParams({ sort: 'name', order: 1 }).toString())
        .then(res => res.json())
        .then(facet => {
          this.projects = facet.data;
          this.updateProjectGantt();
        })
        .catch(err => {
          this.$emit('display-message', 'Error loading projects: ' + err.message, 'error');
        });
    },
    updateProjectGantt() {
      const today = new Date();
      const projectNames = [];
      const projectData = [];

      this.projects.forEach(project => {
        const startDate = new Date(project.startDate);
        const endDate = project.endDate ? new Date(project.endDate) : today;
        const isCompleted = project.endDate && new Date(project.endDate) <= today;

        projectNames.push(project.name);
        projectData.push({
          name: project.name,
          value: [
            startDate,
            endDate,
            endDate - startDate // duration in ms
          ],
          start: startDate,
          end: project.endDate ? endDate : null,
          projectId: project._id,
          status: isCompleted ? 'Completed' : 'Ongoing'
        });
      });

      // Update chart options
      this.projectGanttOptions.yAxis.data = projectNames;
      this.projectGanttOptions.series[0].data = projectData;
    },
    loadTasks() {
      if (!this.selectedProject) return;

      fetch(taskEndpoint + '?' + new URLSearchParams({ project_id: this.selectedProject._id }).toString())
        .then(res => res.json())
        .then(facet => {
          const tasks = facet.data;
          this.updateTaskGantt(tasks);
        })
        .catch(err => {
          this.$emit('display-message', 'Error loading tasks: ' + err.message, 'error');
        });
    },
    updateTaskGantt(tasks) {
      const today = new Date();
      const taskNames = [];
      const taskData = [];

      tasks.forEach(task => {
        const startDate = new Date(task.startDate);
        const endDate = task.endDate ? new Date(task.endDate) : today;
        const isCompleted = task.endDate && new Date(task.endDate) <= today;

        taskNames.push(task.name);
        taskData.push({
          name: task.name,
          value: [
            startDate,
            endDate,
            endDate - startDate // duration in ms
          ],
          start: startDate,
          end: task.endDate ? endDate : null,
          status: isCompleted ? 'Completed' : 'Ongoing'
        });
      });

      // Update chart options
      this.taskGanttOptions.yAxis.data = taskNames;
      this.taskGanttOptions.series[0].data = taskData;
      this.taskGanttOptions.title.text = this.selectedProject ? 
        `Tasks for ${this.selectedProject.name}` : 'Tasks Gantt Chart';
    },
    setupWebSocket() {
      // Close any existing connection
      if (this.websocket) {
        this.websocket.close();
      }

      // Create a new WebSocket connection
      this.websocket = new WebSocket('ws://' + window.location.host + '/ws');
      
      this.websocket.onopen = () => {
        console.log('WebSocket connection established for Analysis component');
      };
      
      this.websocket.onmessage = (event) => {
        let data = {};
        try {
          data = JSON.parse(event.data);
          
          // Check if this is a data update notification
          if (data.type === 'update' && (data.entity === 'project' || data.entity === 'task')) {
            // Refresh the appropriate chart
            if (data.entity === 'project') {
              this.loadProjects();
            } else if (data.entity === 'task' && this.selectedProject && data.projectId === this.selectedProject._id) {
              this.loadTasks();
            }
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.websocket.onclose = () => {
        console.log('WebSocket connection closed');
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (this.websocket && this.websocket.readyState === WebSocket.CLOSED) {
            this.setupWebSocket();
          }
        }, 5000);
      };
    }
  },
  watch: {
    selectedProject() {
      this.loadTasks();
    }
  },
  mounted() {
    if (this.checkIfInRole(this.session, [0])) {
      this.loadProjects();
      this.setupWebSocket();
    }
  },
  beforeUnmount() {
    // Close WebSocket connection when component is destroyed
    if (this.websocket) {
      this.websocket.close();
    }
  }
};
</script>

<template>
  <div v-if="checkIfInRole(session, [0])">
    <h1>Project and Task Analysis</h1>
    
    <div class="gantt-container">
      <h2>Project Timeline</h2>
      <v-chart :option="projectGanttOptions" class="gantt-chart" />
    </div>
    
    <div class="project-selector">
      <v-select
        v-model="selectedProject"
        :items="projects"
        item-title="name"
        item-value="self"
        label="Select a project to view tasks"
        return-object
        variant="outlined"
        class="my-4"
      ></v-select>
    </div>
    
    <div v-if="selectedProject" class="gantt-container">
      <h2>Tasks for: {{ selectedProject.name }}</h2>
      <v-chart :option="taskGanttOptions" class="gantt-chart" />
    </div>
  </div>
  <div v-else>
    <p>You don't have permission to access this page.</p>
  </div>
</template>

<style scoped>
.gantt-container {
  margin-bottom: 2rem;
}

.gantt-chart {
  height: 400px;
  width: 100%;
}

.project-selector {
  max-width: 500px;
  margin: 1rem 0;
}
</style>