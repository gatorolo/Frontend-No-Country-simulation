import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  userName: string = 'Admin';
  userAvatar: string = 'assets/user-placeholder.png';
  private subs = new Subscription();

  constructor(private profileService: ProfileService) { }

  ngOnInit(): void {
    this.subs.add(this.profileService.userName$.subscribe(n => this.userName = n));
    this.subs.add(this.profileService.userAvatar$.subscribe(a => this.userAvatar = a));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}

