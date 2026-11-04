export class ShareController {
  copiedMessage = false;
  copyFailed = false;
  manualLink = '';
  private copyGeneration = 0;
  private destroyed = false;

  get canShare(): boolean {
    return (
      typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    );
  }

  reset() {
    this.copyGeneration++;
    this.copiedMessage = false;
    this.copyFailed = false;
    this.manualLink = '';
  }

  dismissFallback() {
    this.copyFailed = false;
    this.manualLink = '';
  }

  dismissSuccess() {
    this.copiedMessage = false;
  }

  destroy() {
    this.destroyed = true;
    this.copyGeneration++;
  }

  share(url: string, title: string) {
    if (this.canShare) {
      navigator.share({ title, url }).catch(() => {});
    }
  }

  copy(url: string, onUpdate?: () => void) {
    this.reset();
    const generation = this.copyGeneration;

    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      navigator.clipboard.writeText(url).then(
        () => {
          if (this.destroyed || generation !== this.copyGeneration) return;
          this.copiedMessage = true;
          this.copyFailed = false;
          onUpdate?.();
        },
        () => {
          if (this.destroyed || generation !== this.copyGeneration) return;
          this.copiedMessage = false;
          this.copyFailed = true;
          this.manualLink = url;
          onUpdate?.();
        },
      );
    } else {
      this.copiedMessage = false;
      this.copyFailed = true;
      this.manualLink = url;
      onUpdate?.();
    }
  }
}
