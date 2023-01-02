import { Component, OnInit } from '@angular/core';
import { Observable, interval, of, concat } from 'rxjs';
import { map } from 'rxjs/operators';
import { TimeLog } from './time-log.model';
import * as moment from 'moment';
import { Project } from './project.model';
import { ProjectService } from './project.service';
import { LogService } from './log.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'tmt';
  createNew = false;
  activeLog?: TimeLog;
  timer?: Observable<number>;

  projects: Project[] = [];
  logs: TimeLog[] = [];

  ranges = [
    {
      label: 'Today',
      range: () => ({ startDate: moment().startOf('day'), endDate: moment().endOf('day') })
    },
    {
      label: 'This week',
      range: () => ({ startDate: moment().startOf('week'), endDate: moment().endOf('week') })
    },
    {
      label: 'This month',
      range: () => ({ startDate: moment().startOf('month'), endDate: moment().endOf('month') })
    },
  ];
  timeChartOptions: any;
  timeChartDetailOptions: any;
  stackedOptions: any;

  selectedRange = this.ranges[0];

  constructor(private projectService: ProjectService, private logService: LogService) { }

  ngOnInit(): void {
    this.projectService.loadProjects().subscribe(projects => this.projects = projects);
    this.logService.loadActiveLog().subscribe(log => {
      if (log) {
        this.activeLog = log;
        this.startTimer();
      }
    });
    this.onRangeChange();
  }

  onRangeChange() {
    const { startDate, endDate } = this.selectedRange.range();
    this.logService.loadLogs(startDate.toISOString(), endDate.toISOString()).subscribe(logs => {
      this.logs = logs;

      this.timeChartOptions = {
        labels: this.projects.map(project => project.name),
        datasets: [
          {
            data: this.projects.map(project => logs.filter(log => log.projectName === project.name)
              .reduce((acc, el) => acc + moment(el.endTime).diff(el.startTime, 'minutes'), 0)
            )
          }
        ]
      };

      let subrange: string[];
      if (this.selectedRange.label === 'Today') {
        subrange = [...Array(24).keys()].map(x => x + '');
      } else if (this.selectedRange.label === 'This week') {
        subrange = moment.weekdays(true);
      } else {
        subrange = [...Array(moment().endOf('month').date()).keys()].map(x => (x + 1) + '');
      }

      this.timeChartDetailOptions = {
        labels: subrange,
        datasets: this.projects.map(project => ({
          type: 'bar',
          label: project.name,
          data: subrange.map((range, i) => this.logs.filter(log => log.projectName === project.name)
            .map(log => {
              let unit: moment.unitOfTime.All;
              let unitValue: number = i;
              if (this.selectedRange.label === 'Today') {
                unit = 'hour';
              } else if (this.selectedRange.label === 'This week') {
                unit = 'day';
              } else {
                unit = 'date';
                unitValue = +range;
              }

              let periodStart = moment().set(unit, unitValue).startOf(unit);

              if (periodStart.isBetween(moment(log.startTime), moment(log.endTime), unit, '[]')) {
                let startDate = moment.max(periodStart, moment(log.startTime));
                let endDate = moment.min(periodStart.clone().endOf(unit), moment(log.endTime));

                return endDate.diff(startDate, 'seconds');
              }
              return 0;
            }).reduce((acc, x) => acc + x, 0))
        }))
      };
      this.stackedOptions = {
        tooltips: {
          mode: 'index',
          intersect: false
        },
        responsive: true,
        scales: {
          xAxes: [{
            stacked: true,
          }],
          yAxes: [{
            stacked: true
          }]
        }
      };
    });
  }

  openCreateProject(): void {
    this.createNew = true;
  }

  createProject(projectName: string): void {
    this.createNew = false;
    this.projectService.createProject({ name: projectName }).subscribe(projects => this.projects = projects);
  }

  deleteProject(project: Project): void {
    this.projectService.deleteProject(project).subscribe(projects => this.projects = projects);
  }

  startProject(project: Project) {
    if (this.activeLog) {
      this.logService.finishLog(this.activeLog as TimeLog).subscribe();
    }
    this.logService.startLog({
      projectName: project.name,
    }).subscribe(log => {
      this.activeLog = log;

      this.startTimer();
    });
  }

  startTimer() {
    this.timer = concat(of(0), interval(1000)).pipe(map(() => {
      return moment().diff((this.activeLog as TimeLog).startTime, 'milliseconds');
    }));
  }

  stopProject() {
    this.logService.finishLog(this.activeLog as TimeLog).subscribe(() => this.activeLog = undefined);
  }
}
