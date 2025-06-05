import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { FeedbackReq } from '../../user/interfaces';
import { Rating } from 'primeng/rating';
import { Button } from 'primeng/button';
import { FeedbackService } from '../../../services/feedback.service';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-feedback',
  imports: [
    FormsModule,
    Rating,
    Button,
    Toast
  ],
  providers: [MessageService],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackComponent implements OnInit {

  public feedbackService = inject(FeedbackService);
  private messageService = inject(MessageService);

  isOpen = false;
  currentStep = 1;
  totalSteps = 6;

  feedbackForm: FormGroup;
  feedbackData: FeedbackReq = {
    experience: 0,
    comment_experience: '',
    updates: '',
    add_or_remove: '',
    calification: 0
  };

  improvementOptions = [
    { label: 'Funcionalidad', selected: false },
    { label: 'Interfaz', selected: false },
    { label: 'Ninguna', selected: false }
  ];

  selectedOption = '';

  constructor(private fb: FormBuilder) {
    this.feedbackForm = this.fb.group({
      experience: [0, Validators.required],
      comment_experience: ['', Validators.required],
      updates: [''],
      add_or_remove: [''],
      functionalityChanges: [''],
      calification: [0, Validators.required]
    });
  }

  ngOnInit(): void { }

  toggleWidget(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.resetForm();
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onCheckboxChange(option: string, index: number): void {
    this.improvementOptions.forEach(opt => opt.selected = false);
    this.selectedOption = option;

    this.improvementOptions[index].selected = true;
  }


  onRatingExperienceChange(rating: number, field: string): void {
    this.feedbackData.experience = rating;
  }

  onRatingCalificationChange(rating: number, field: string): void {
    this.feedbackData.calification = rating;
  }

  isStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.feedbackData.experience > 0;
      case 2:
        return this.feedbackData.comment_experience.length > 0;
      case 6:
        return this.feedbackData.calification > 0;
      default:
        return true;
    }
  }

  submitFeedback(): void {
    this.feedbackService.saveFeedback(this.feedbackData).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message, life: 3000 });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el feedback', life: 3000 });
      }
    });

    this.showThankYou();
  }

  showThankYou(): void {
    this.currentStep = 7;
  }

  resetForm(): void {
    this.currentStep = 1;
    this.feedbackData = {
      experience: 0,
      comment_experience: '',
      updates: '',
      add_or_remove: '',
      calification: 0
    };
    this.feedbackForm.reset();
  }

  closeFeedback(): void {
    this.toggleWidget();
  }
}
