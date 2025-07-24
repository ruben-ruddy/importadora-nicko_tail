import { TestBed } from '@angular/core/testing';

import { HomeProductsService } from './home-products.service';

describe('HomeProductsService', () => {
  let service: HomeProductsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HomeProductsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
