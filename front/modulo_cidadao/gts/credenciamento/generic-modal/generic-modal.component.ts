import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-generic-modal',
  templateUrl: './generic-modal.component.html',
  styleUrls: ['./generic-modal.component.css']
})
export class GenericModalComponent implements OnInit {
  @Input() id: string
  @Input() title: string
  @Input() description: string
  @Input() width: number

  constructor() { }

  ngOnInit(): void {
  }

}
