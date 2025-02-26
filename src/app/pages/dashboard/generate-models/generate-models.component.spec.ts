import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateModelsComponent } from './generate-models.component';

describe('GenerateModelsComponent', () => {
  let component: GenerateModelsComponent;
  let fixture: ComponentFixture<GenerateModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateModelsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerateModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
