import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeProductModalComponent } from './home-product-modal.component';

describe('HomeProductModalComponent', () => {
  let component: HomeProductModalComponent;
  let fixture: ComponentFixture<HomeProductModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeProductModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeProductModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
