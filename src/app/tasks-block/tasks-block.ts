import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';

const PAGE_SIZE = 100;
const ITEM_HEIGHT = 22;
const EXTRA_ROWS = 16;

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

  //Pagination data
  size: number = PAGE_SIZE;
  totalItems = 0;

  constructor() {
  }

  ngOnInit() {
    this.fetchInitialData()
  }

  async fetchInitialData(){
    try{
      await this.fetchNewDataFromServer(0, this.size);
      this.setItemsForDisplay(0);
    }catch (err){
      console.log(err)
    }

  }

  async fetchNewDataFromServer(start: number, end: number) {
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
    }catch (err){
      console.log(err)
    }
  }


  onScroll() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.updateViewOnScroll()
    }, 300);
  }

  updateViewOnScroll() {
    const pxScrolled = Math.max(0, -1 * this.scrollContainer?.nativeElement?.getBoundingClientRect()?.top);
    const scrolledRatio = pxScrolled / this.scrollContainer?.nativeElement?.getBoundingClientRect()?.height;
    const newFirstDisplayedItemIndex = Math.max(Math.floor(scrolledRatio * this.totalItems), 0);
    if (newFirstDisplayedItemIndex !== this.firstDisplayedIndex) {
      this.firstDisplayedIndex = newFirstDisplayedItemIndex;
      this.fetchData(pxScrolled);
    }
  }

  async fetchData(scrollTo:number){
    const firstItemMissingIndexInCache = this.getMissingIndex(this.firstDisplayedIndex);
    if(firstItemMissingIndexInCache){//Need to fetch more data
      const reminder = firstItemMissingIndexInCache % this.size;
      const closestRoundStart = firstItemMissingIndexInCache - reminder;
      try{
        await this.fetchNewDataFromServer(closestRoundStart, closestRoundStart + this.size);
        this.fetchData(scrollTo);
      }catch (err){
        console.log(err);
      }
    }else{//Set new view from cache
      this.setItemsForDisplay(this.firstDisplayedIndex, this.firstDisplayedIndex+this.numberOfItemsToDisplay, scrollTo);
    }
  }

  getMissingIndex(firstIndexToDisplay:number){
    const start = Math.max(0, firstIndexToDisplay - 1);
    const end = Math.min(firstIndexToDisplay + (this.numberOfItemsToDisplay));

    let needToFetchData = false;
    let i = start;
    for (; i < end && i < this.totalItems; i++) {
      if (!this.cachedData[i]) {
        needToFetchData = true;
        break;
      }
    }
    if(needToFetchData) return i;
    return;
  }

  setItemsForDisplay(start: number, end=this.numberOfItemsToDisplay, scrollTo=0){
    let firstIndexForSlice = start;
    if (start > this.totalItems - this.numberOfItemsToDisplay) {
      firstIndexForSlice = this.totalItems - this.numberOfItemsToDisplay;//Prevent end of range over scrolling
    }
    this.displayedItems = this.cachedData.slice(firstIndexForSlice, end);
    this.itemWrapperMarginTop = Math.max(scrollTo, 0);
  }

  cacheData(data: { key: string; value: string }[], start: number) {
    data.forEach((item, index) => {
      this.cachedData[start + index] = item;
    })
  }

  calculateViewHeights() {
    const mainHeight = this.main?.nativeElement.getBoundingClientRect()?.height;
    this.numberOfItemsToDisplay = Math.ceil(mainHeight / this.itemHeight)+EXTRA_ROWS;
    this.scrollContainerHeight = this.totalItems * this.itemHeight;
    this.innerItemsWrapperHeight = (this.numberOfItemsToDisplay) * this.itemHeight;
  }

  ngOnDestroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}
