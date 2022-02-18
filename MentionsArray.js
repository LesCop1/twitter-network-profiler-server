class MentionsArray {
  constructor(target) {
    this.banId = target;
    this.keys = [];
    this.occurrence = [];
  }

  add(key) {
    if (key !== this.banId) {
      const index = this.keys.indexOf(key);
      if (index === -1) {
        this.keys.push(key);
        this.occurrence.push(1);
      } else {
        this.occurrence[index] = this.occurrence[index] + 1;
      }
    }
  }

  getOccurrence(key) {
    const index = this.keys.indexOf(key);
    if (index >= 0) return this.occurrence[index];

    return -1;
  }

  getOccurrenceByIndex(i) {
    if (0 <= i && i < this.occurrence.length) return this.occurrence[i];
    return -1;
  }

  getKeys() {
    return this.keys;
  }

  getKeyByIndex(i) {
    if (0 <= i && i < this.keys.length) return this.keys[i];
    return "";
  }

  size() {
    return this.keys.length;
  }

  sortByOccurrence() {
    let tempOcc, tempKey;

    for (let i = 0; i < this.occurrence.length - 1; i++) {
      for (let j = i + 1; j < this.occurrence.length; j++) {
        if (this.occurrence[j] > this.occurrence[i]) {
          tempOcc = this.occurrence[i];
          tempKey = this.keys[i];

          this.occurrence[i] = this.occurrence[j];
          this.keys[i] = this.keys[j];

          this.occurrence[j] = tempOcc;
          this.keys[j] = tempKey;
        }
      }
    }
  }

  keepMax(length) {
    const keepCount = Math.min(length, this.keys.length);
    this.keys = this.keys.slice(0, keepCount);
    this.occurrence = this.occurrence.slice(0, keepCount);
  }
}

export default MentionsArray;
