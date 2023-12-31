import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { Turno } from 'src/app/interfaces/Turno';
import { Mascota } from 'src/app/interfaces/Mascota';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TurnosService } from 'src/app/servicios/turnos.service';
import { UsuariosService } from 'src/app/servicios/usuarios.service';
import { MascotasService } from 'src/app/servicios/mascotas.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/servicios/auth.service';
import { Usuario } from 'src/app/interfaces/Usuario';


@Component({
  selector: 'app-formulario-turno',
  templateUrl: './formulario-turno.component.html',
  styleUrls: ['./formulario-turno.component.css']
})
export class FormularioTurnoComponent {
  @Output() onAddExperience: EventEmitter<Turno> = new EventEmitter();
  @Output() onEditExperience: EventEmitter<Turno> = new EventEmitter();
  @Output() onToggleFormExperience: EventEmitter<Event> = new EventEmitter();
  showFormExperience: boolean = false;
  subscription?: Subscription;
  form: FormGroup;
  sub: any;
  edit: boolean = false;
  usuarioId!: number;
  mascotaId!: number;
  mascotas!: Mascota[];
  mascota!: Mascota;
  mainUser!: Usuario;

  constructor(
    private formBuilder: FormBuilder,
    private turnosService: TurnosService,
    private usuariosService: UsuariosService,
    private route: ActivatedRoute,
    public router: Router,
    private authService: AuthService
  ) {
    this.form = this.formBuilder.group({
      id: [],
      horario: new FormControl('', { validators: Validators.required, updateOn: 'blur' }),
      motivo: new FormControl('', { validators: Validators.required}),
      fecha: new FormControl('', { updateOn: 'blur' }),
      mascota_id: new FormControl(''),
      usuario_id: new FormControl(''),
      nomUsuario: new FormControl(''),
      nomMascota: new FormControl(''),
      dniUser: new FormControl('')
    })
    this.sub = this.route.params.subscribe(params => {
      this.authService.getMainUsuario().subscribe((usuario) => {
        this.mainUser = usuario;
      })
      this.usuarioId = params['usuarioId'];
      this.usuariosService.getById(this.usuarioId).subscribe((usuario) => {
        this.mascotas = usuario.mascotas;
      })
      this.edit = params['turnoId'] != -1;
      if (this.edit) {
        this.edit = true;
        this.turnosService.getById(params['turnoId']).subscribe((turno) => {
          console.log(turno)
          this.form?.patchValue(turno)
          this.form?.patchValue({ fecha: this.formatDate(new Date(turno.fecha)) })
        })
      } else {
        this.form.reset()
      }
      this.form.patchValue({ "usuario_id": this.usuarioId });
    });
  }

  private formatDate(date: Date) {
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  get Horario() {
    return this.form.get("horario");
  }

  get Motivo() {
    return this.form.get("motivo");
  }

  get Mascota() {
    return this.form.get("mascota");
  }

  get Fecha() {
    return this.form.get("fecha");
  }

  public onAdd(): void {
    if (this.form.valid) {
      this.form.patchValue({ 
        "usuario_id": this.usuarioId,
        "nomUsuario": this.mainUser.nombre,
        "dniUser": this.mainUser.DNI,
        "nomMascota": this.mascotas.find(mascota => mascota.id == this.form.value.mascota_id)?.nombre
      })
      this.turnosService.add(this.form.getRawValue()).subscribe((message) => {
        if (message.error) {
          alert(message.error)
        } else {
          let fecha = new Date(message.fecha_turno)
          fecha.setDate(fecha.getDate() + 1)
          alert(message.message + '. La fecha del turno es: ' + fecha.toLocaleDateString())
          this.router.navigate(['/turnos']);
          this.form.reset()
        }
      });

    } else {
      console.log(this.form.errors)
      console.log('Probando...' + this.form.getRawValue())
      this.form.markAllAsTouched();
    }

  }


  public onEdit(): void {
    this.form.removeControl("fecha")
    if (this.form.valid) {
      this.form.patchValue({ "usuario_id": this.mainUser.id })
      this.turnosService.edit(this.form.getRawValue()).subscribe((message) => {
        if (message.error) {
          alert(message.error)
        } else {
          alert(message.message)
          this.router.navigate(['/turnos']);
        }
      })
    } else {
      console.log(this.form.errors)
      this.form.markAllAsTouched();
    }
  }

}
