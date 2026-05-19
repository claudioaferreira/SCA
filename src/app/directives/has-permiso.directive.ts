import { Directive, Input, OnInit, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../services/user/auth.service';

/**
 * Directiva estructural: muestra u oculta un elemento HTML según si el
 * usuario tiene o no un permiso específico.
 *
 * PARA USARLA en un componente standalone, añade al array imports:
 *   imports: [HasPermisoDirective]
 *
 * USO EN EL TEMPLATE:
 *
 *   Mostrar solo si tiene el permiso:
 *   <button *hasPermiso="'usuarios.crear'">Nuevo usuario</button>
 *
 *   Con bloque alternativo (si NO tiene el permiso, muestra otra cosa):
 *   <div *hasPermiso="'roles.gestionar'; else sinAcceso">Panel de roles</div>
 *   <ng-template #sinAcceso>
 *     <p>No tienes acceso a esta sección.</p>
 *   </ng-template>
 */
@Directive({
  selector: '[hasPermiso]',
  standalone: true,
})
export class HasPermisoDirective implements OnInit {

  private tpl  = inject(TemplateRef<any>);
  private vcr  = inject(ViewContainerRef);
  private auth = inject(AuthService);

  @Input({ required: true }) hasPermiso!: string;
  @Input() hasPermisoElse?: TemplateRef<any>;

  ngOnInit(): void {
    this.vcr.clear();
    if (this.auth.hasPermiso(this.hasPermiso)) {
      this.vcr.createEmbeddedView(this.tpl);
    } else if (this.hasPermisoElse) {
      this.vcr.createEmbeddedView(this.hasPermisoElse);
    }
  }
}
