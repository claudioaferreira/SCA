import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';



@Component({
  selector: 'app-levantamiento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './levantamiento.component.html',
  styleUrl: './levantamiento.component.css'
})
export class LevantamientoComponent  {
  
}

