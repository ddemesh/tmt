import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TimeLog } from './time-log.model';
import { map, tap } from 'rxjs/operators';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class LogService {

  constructor() { }

  loadActiveLog(): Observable<TimeLog> {
    const logJson = localStorage.getItem('activeLog');
    let log = null;

    if (logJson) {
      log = JSON.parse(logJson);
    }

    return of(log);
  }

  loadLogs(startDate?: string, endDate?: string): Observable<TimeLog[]> {
    const logsJson = localStorage.getItem('logs');
    let logs: TimeLog[] = [];

    if (logsJson) {
      logs = JSON.parse(logsJson);
    }

    if (startDate) {
      logs = logs.filter((log: TimeLog) => log.startTime && log.startTime >= startDate);
    }

    if (endDate) {
      logs = logs.filter((log: TimeLog) => log.endTime && log.endTime <= endDate);
    }

    return of(logs);
  }

  startLog(log: TimeLog): Observable<TimeLog> {
    log.startTime = moment().toISOString();

    localStorage.setItem('activeLog', JSON.stringify(log));

    return of(log);
  }

  finishLog(log: TimeLog): Observable<TimeLog> {
    log.endTime = moment().toISOString();
    localStorage.removeItem('activeLog');

    return this.loadLogs().pipe(
      map(logs => [...logs, log]),
      tap(logs => localStorage.setItem('logs', JSON.stringify(logs))),
      map(() => log)
    );
  }
}
