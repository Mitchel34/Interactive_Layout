class Control {
    constructor(data) {
        console.log("Control initialized with data:", data);

        // Set up layout size
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Use the existing root container instead of creating a new one
        this.root = d3.select('#root');
        
        // Define margin for visualizations
        this.margin = { top: 50, right: 200, bottom: 30, left: 50 };

        // Public variables for the shared data and color scale
        this.data = data;
        this.filteredData = data.slice(); // copy of data (no filtering initially)
        this.color = d3.scaleOrdinal()
            .domain(["Setosa", "Versicolor", "Virginica"])
            .range(["#8BC34A", "#9575CD", "#FFB74D"]);

        // Active filter (null when no filter is applied)
        this.activeFilter = null;

        // Instantiate the visualizations with filteredData and shared color scale.
        this.radviz = new RadViz(this.filteredData, this);
        this.parallel = new Para(this.filteredData, this);
        this.pie = new Pie(this.filteredData, width, height, this);

        console.log("Control initialized.");
    }

    // Highlight matching elements across all views without filtering.
    highlightViews(species) {
        this.radviz.highlightBySpecies(species);
        this.parallel.highlightBySpecies(species);
        this.pie.highlightBySpecies(species);
    }

    // When an element is clicked or a brush event occurs, update all views by filtering the dataset.
    updateViews(filterFunc) {
        this.filteredData = this.data.filter(filterFunc);
        this.radviz.update(this.filteredData);
        this.parallel.update(this.filteredData);
        this.pie.update(this.filteredData, null);
    }

    // Reset—that is, remove any filtering.
    resetViews() {
        this.filteredData = this.data.slice();
        this.radviz.update(this.filteredData);
        this.parallel.update(this.filteredData);
        this.pie.update(this.filteredData, null);
    }

    // Called when hovering over an element in parallel coordinates (or elsewhere).
    onParaHover(d) {
        this.highlightViews(d.variety);
    }

    // Called when the mouse exits an element to clear highlights.
    onHoverExit() {
        this.radviz.unhighlight();
        this.parallel.clearHighlight();
        this.pie.Unhighlight();
    }
}
