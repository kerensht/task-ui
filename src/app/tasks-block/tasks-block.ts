import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';

const PAGE_SIZE = 100;
const ITEM_HEIGHT = 22;

interface Item {
  key: string;
  value: string;
}

@Component({
  selector: 'app-tasks-block',
  templateUrl: './tasks-block.html',
  styleUrl: './tasks-block.scss'
})
export class TasksBlock implements OnInit, OnDestroy {
  @ViewChild("scrollContainer") scrollContainer?: ElementRef;
  @ViewChild("main") main?: ElementRef;

  debounceTimer: any;
  loading = false;

  //Data
  displayedItems: Item[] = [];
  cachedData?: any;


  //Height calculations
  numberOfItemsToDisplay = 0;
  itemHeight = ITEM_HEIGHT;
  scrollContainerHeight = 0;
  innerItemsWrapperHeight = 0;

  //Scrolling
  itemWrapperMarginTop = 0;
  firstDisplayedIndex = 0;
  lastPxScrolled = 0;

  //Pagination data
  size: number = PAGE_SIZE;
  totalItems = 0;

  constructor() {
  }

  ngOnInit() {
    this.fetchData(0, this.size);
  }

  onScroll() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.setDisplayedData()
    }, 200);
  }

  setDisplayedData() {
    const pxScrolled = Math.max(0, -1 * this.scrollContainer?.nativeElement?.getBoundingClientRect()?.top);
    this.lastPxScrolled = pxScrolled;
    const scrolledRatio = pxScrolled / this.scrollContainer?.nativeElement?.getBoundingClientRect()?.height;
    const newFirstDisplayedItemIndex = Math.max(Math.floor(scrolledRatio * this.totalItems), 0);
    if (newFirstDisplayedItemIndex !== this.firstDisplayedIndex) {
      this.firstDisplayedIndex = newFirstDisplayedItemIndex;
      this.setDisplayedItems(this.firstDisplayedIndex, pxScrolled);
    }

  }

  async setDisplayedItems(firstDisplayedIndex: number, scrollTo: number) {
    const start = Math.max(0, firstDisplayedIndex - 1);
    const end = Math.min(firstDisplayedIndex + (this.numberOfItemsToDisplay));

    let needToFetchData = false;
    let i = start;
    for (; i < end && i < this.totalItems; i++) {
      if (!this.cachedData[i]) {
        needToFetchData = true;
        break;
      }
    }
    if (!needToFetchData) {
      let firstIndexForSlice = start;
      if (start < 0) {
        firstIndexForSlice = 0;
      } else if (start > this.totalItems - this.numberOfItemsToDisplay) {
        firstIndexForSlice = this.totalItems - this.numberOfItemsToDisplay
      }
      this.displayedItems = this.cachedData.slice(firstIndexForSlice, end);
      this.itemWrapperMarginTop = Math.max(scrollTo, 0);
    } else {
      const reminder = i % this.size;
      const closestRoundStart = i - reminder;
      await this.fetchData(closestRoundStart, closestRoundStart + this.size);
      this.setDisplayedItems(firstDisplayedIndex, scrollTo);
    }

    return;
  }

  async fetchData(start: number, end: number) {
    if ((this.totalItems && start >= this.totalItems) || this.loading ) return;
    this.loading = true;
    try{
      const res = await fetch(`http://localhost:8000/random-strings?start=${start}&end=${end}`);
      const data = await res.json();
      this.loading = false;
      this.totalItems = data.total || 0;
      if (!this.cachedData) {
        this.cachedData = new Array(this.totalItems);
      }
      this.calculateViewHeights();
      this.cacheData(data.data, start);
      this.setItemsForDisplay(start)
    }catch (err){
      console.log(err)
    }
  }

  setItemsForDisplay(start: number){
    let firstIndexForSlice = start;
    if (start > this.totalItems - this.numberOfItemsToDisplay) {
      firstIndexForSlice = this.totalItems - this.numberOfItemsToDisplay;//Prevent over scrolling in end of range
    }
    this.displayedItems = this.cachedData.slice(firstIndexForSlice, this.numberOfItemsToDisplay);
  }

  cacheData(data: { key: string; value: string }[], start: number) {
    data.forEach((item, index) => {
      this.cachedData[start + index] = item;
    })
  }

  calculateViewHeights() {
    const mainHeight = this.main?.nativeElement.getBoundingClientRect()?.height;
    this.numberOfItemsToDisplay = Math.ceil(mainHeight / this.itemHeight);
    this.scrollContainerHeight = this.totalItems * this.itemHeight;
    this.innerItemsWrapperHeight = (this.numberOfItemsToDisplay) * this.itemHeight;
  }

  ngOnDestroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}
