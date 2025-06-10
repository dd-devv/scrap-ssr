import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingAddProductButtonComponent } from './floating-add-product-button.component';

describe('FloatingAddProductButtonComponent', () => {
  let component: FloatingAddProductButtonComponent;
  let fixture: ComponentFixture<FloatingAddProductButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingAddProductButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingAddProductButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
