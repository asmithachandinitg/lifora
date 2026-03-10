import { Component, AfterViewInit, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, AfterViewInit {

  modules = [
    { icon: '🏠', name: 'Dashboard',   desc: 'Your daily command centre',   color: '#ff6b6b' },
    { icon: '✅', name: 'Tasks',        desc: 'Get things done',             color: '#4d96ff' },
    { icon: '🔁', name: 'Habits',       desc: 'Build streaks that stick',    color: '#6bcb77' },
    { icon: '🎯', name: 'Goals',        desc: 'Dream big, track bigger',     color: '#c77dff' },
    { icon: '🍽️', name: 'Food',         desc: 'Nutrition & meals',           color: '#ffd93d' },
    { icon: '💪', name: 'Fitness',      desc: 'Workouts & strength',         color: '#ff6b6b' },
    { icon: '😴', name: 'Sleep',        desc: 'Rest & recovery',             color: '#4d96ff' },
    { icon: '😊', name: 'Mood',         desc: 'Emotional wellness',          color: '#ff6fd8' },
    { icon: '💊', name: 'Medicine',     desc: 'Never miss a dose',           color: '#6bcb77' },
    { icon: '💰', name: 'Finance',      desc: 'Budget & expenses',           color: '#ff6b6b' },
    { icon: '✈️', name: 'Travel',       desc: 'Plan your adventures',        color: '#ffd93d' },
    { icon: '📔', name: 'Journal',      desc: 'Your personal diary',         color: '#c77dff' },
    { icon: '📚', name: 'Reading',      desc: 'Books & learning',            color: '#4d96ff' },
    { icon: '💡', name: 'Knowledge',    desc: 'Notes & ideas',               color: '#ff6fd8' },
    { icon: '🩸', name: 'Period',       desc: 'Cycle tracking',              color: '#6bcb77' },
    { icon: '🤰', name: 'Pregnancy',    desc: 'Week by week journey',        color: '#ff6fd8' },
    { icon: '🧠', name: 'Vision Board', desc: 'Manifest your dreams',        color: '#ffd93d' },
    { icon: '⚙️', name: 'Settings',    desc: 'Make it yours',               color: '#ff6b6b' },
  ];

  features = [
    { icon: '🔗', color: 'rgba(255,107,107,0.15)',   title: 'Cross-module insights',    desc: 'Link your Goals to Habits. Sync Travel expenses to Finance. Everything talks to everything.' },
    { icon: '🎨', color: 'rgba(77,150,255,0.15)',    title: '6 beautiful themes',       desc: 'Lavender, Ocean, Forest, Rose, Sunset, Teal. Pick a color that matches your mood.' },
    { icon: '🔔', color: 'rgba(107,203,119,0.15)',   title: 'Smart notifications',      desc: 'Period cycle alerts, task deadlines, medicine reminders, travel countdowns — all intelligent.' },
    { icon: '📱', color: 'rgba(255,107,216,0.15)',   title: 'Flutter app coming soon',  desc: 'The same power, natively on your phone. iOS & Android app in development.' },
  ];

  steps = [
    { num: '1', title: 'Create your account',    desc: 'Sign up in seconds. Set your profile, gender, and preferences to personalise your experience.' },
    { num: '2', title: 'Choose your modules',    desc: 'Enable only the modules you need. Hide what\'s not relevant — Lifora adapts to you.' },
    { num: '3', title: 'Track, improve, grow',   desc: 'Log daily. Watch your streaks, stats, and insights build up into a beautiful picture of your life.' },
  ];

  ngOnInit() {
  document.body.style.overflow = 'auto';
  window.scrollTo(0, 0);
}

ngOnDestroy() {
  document.body.style.overflow = '';
}
  ngAfterViewInit() {
    // Delay so *ngFor finishes rendering before we query elements
    setTimeout(() => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

      document.querySelectorAll('.reveal').forEach(el => {
        const rect = el.getBoundingClientRect();
        // Already in viewport — make visible immediately
        if (rect.top < window.innerHeight) {
          el.classList.add('visible');
        } else {
          observer.observe(el);
        }
      });
    }, 100);

    window.addEventListener('scroll', () => {
      const nav = document.querySelector('nav');
      if (nav) nav.style.boxShadow = window.scrollY > 10 ? '0 4px 20px rgba(0,0,0,0.08)' : 'none';
    });
  }
}
