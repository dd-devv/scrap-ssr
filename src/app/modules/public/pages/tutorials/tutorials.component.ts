import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tutorials',
  imports: [CommonModule],
  templateUrl: './tutorials.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TutorialsComponent implements OnInit {
  mostrarVideoCrearCuenta = false;
  mostrarVideoIniciarSesion = false;
  mostrarVideoAgregarProducto = false;

  ngOnInit(): void {
    this.mostrarVideoCrearCuenta = false;
  }

  play_video_create_user() {
    this.mostrarVideoCrearCuenta = true;
  }

  play_video_login_user() {
    this.mostrarVideoIniciarSesion = true;
  }

  play_video_add_product() {
    this.mostrarVideoAgregarProducto = true;
  }
}
