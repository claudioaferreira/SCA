import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { UserService } from '../../../services/user/user.service';
import { EmpleadoSinUsuario, Rol, UsuarioListado } from '../../../interfaces/asignacion.interface';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent implements OnInit {

  private userService = inject(UserService);
  private fb          = inject(FormBuilder);

  loading     = false;
  usuarios:   UsuarioListado[]     = [];
  roles:      Rol[]                = [];
  empleados:  EmpleadoSinUsuario[] = [];

  filtroTexto = '';
  modalAbierto = false;
  guardando    = false;

  formulario!: FormGroup;

  ngOnInit(): void {
    this.construirFormulario();
    this.cargar();
  }

  private construirFormulario(): void {
    this.formulario = this.fb.group({
      IdEmpleado: [null, Validators.required],
      email:      ['',   [Validators.required, Validators.email]],
      IdRol:      [null, Validators.required],
    });
  }

  cargar(): void {
    this.loading = true;
    this.userService.obtenerUsuarios().subscribe({
      next: (res) => { this.usuarios = res.body ?? []; this.loading = false; },
      error: ()    => { this.loading = false; },
    });
  }

  onEmpleadoChange(): void {
  const id       = this.formulario.value.IdEmpleado;
  const empleado = this.empleados.find(e => e.id === id);

  if (empleado?.correo) {
    this.formulario.patchValue({ email: empleado.correo });
  } else {
    this.formulario.patchValue({ email: '' });
  }
}

  abrirModal(): void {
    this.formulario.reset();
    this.guardando = false;

    // Cargar roles y empleados sin cuenta en paralelo
    this.userService.getRoles().subscribe({
      next: (res) => this.roles = res.body ?? [],
    });
    this.userService.getEmpleadosSinUsuario().subscribe({
      next: (res) => this.empleados = res.body ?? [],
    });

    this.modalAbierto = true;
  }

  cerrarModal(): void { this.modalAbierto = false; }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.userService.createUser(this.formulario.value).subscribe({
      next: (res) => {
        this.guardando = false;
        this.cerrarModal();
        Swal.fire({
          icon: 'success',
          title: 'Usuario creado',
          html: `
            <p>El usuario <strong>${res.body?.username}</strong> fue creado exitosamente.</p>
            <p class="text-muted" style="font-size:0.85rem">
              Contraseña temporal: <strong>Temp123*</strong><br>
              El usuario deberá cambiarla en su primer inicio de sesión.
            </p>
          `,
        });
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message ?? 'No se pudo crear el usuario',
        });
      },
    });
  }

  async toggleActive(u: UsuarioListado): Promise<void> {
    const accion = u.isActive ? 'desactivar' : 'activar';
    const conf   = await Swal.fire({
      icon: 'question',
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
      text: `${u.empleado} — ${u.username}`,
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText:  'Cancelar',
    });
    if (!conf.isConfirmed) return;

    this.userService.toggleActive(u.id, !u.isActive).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Listo', timer: 1200, showConfirmButton: false });
        this.cargar();
      },
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cambiar el estado' }),
    });
  }

  get usuariosFiltrados(): UsuarioListado[] {
    const t = this.filtroTexto.toLowerCase().trim();
    if (!t) return this.usuarios;
    return this.usuarios.filter(u =>
      u.empleado.toLowerCase().includes(t) ||
      u.username.toLowerCase().includes(t)  ||
      u.email.toLowerCase().includes(t)
    );
  }

  iniciales(nombre: string): string {
    if (!nombre) return '??';
    const p = nombre.trim().split(' ');
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
  }

  campoInvalido(campo: string): boolean {
    const c = this.formulario.get(campo);
    return !!c && c.invalid && c.touched;
  }
}