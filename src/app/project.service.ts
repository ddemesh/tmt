import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Project } from './project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor() {
  }

  loadProjects(): Observable<Array<Project>> {
    const projectsJson = localStorage.getItem('projects');

    let projects: Project[] = [];
    if (projectsJson) {
      projects = JSON.parse(projectsJson);
    }

    return of(projects);
  }

  createProject(project: Project): Observable<Project[]> {
    return this.loadProjects().pipe(
      map(projects => [...projects, project]),
      tap(projects => localStorage.setItem('projects', JSON.stringify(projects)))
    );
  }

  deleteProject(project: Project): Observable<Project[]> {
    return this.loadProjects().pipe(
      map(projects => projects.filter(pr => pr.name !== project.name)),
      tap(projects => localStorage.setItem('projects', JSON.stringify(projects)))
    );
  }
}
