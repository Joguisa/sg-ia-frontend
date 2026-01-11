import { Component, computed, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService, SupportedLanguage } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.css']
})
export class LanguageSelectorComponent {
  private languageService = inject(LanguageService);
  private elementRef = inject(ElementRef);

  isOpen = false;

  currentLang = computed(() => {
    const code = this.languageService.currentLanguage();
    return this.languageService.availableLanguages.find(l => l.code === code);
  });

  get availableLanguages() {
    return this.languageService.availableLanguages;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectLanguage(lang: SupportedLanguage): void {
    this.languageService.setLanguage(lang);
    this.isOpen = false;
  }
}
