import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {

  breadcrumbs: { label: string, url: string }[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.breadcrumbs = this.buildBreadcrumb(this.route.root);
      });
  }

  private buildBreadcrumb(route: ActivatedRoute, url: string = '', breadcrumbs: any[] = []): any[] {

  const children = route.children;

  if (children.length === 0) {
    return breadcrumbs;
  }

  for (const child of children) {

    const routeURL = child.snapshot.url.map(segment => segment.path).join('/');

    if (routeURL) {
      url += `/${routeURL}`;
    }

    const label = child.snapshot.title; // 👈 importante

    if (label) {
      breadcrumbs.push({ label, url });
    }

    return this.buildBreadcrumb(child, url, breadcrumbs);
  }

  return breadcrumbs;
}
}