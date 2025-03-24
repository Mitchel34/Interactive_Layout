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
            .range(["#8BC34A", "#9575CD", "#FFB74D"]); // Updated colors to match the image

        // Active filter (null when no filter is applied)
        this.activeFilter = null;

        // Instantiate the three visualizations with the current filtered data.
        // Note: The visualizations call back into control via:
        //   - onRadvizHover(d) from radviz.js,
        //   - onParaHover(d)   from parallelcoordinate.js, and
        //   - Select(variety)   from the pie chart (pie.js)
        this.radviz = new RadViz(this.filteredData, this);
        this.parallel = new Para(this.filteredData, this);
        this.pie = new Pie(this.filteredData, width, height, this);

        console.log("Control initialized.");
    }

    // Hover highlighting: highlighting in all views based on hovered datapoint
    onHover(dataPoint) {
        this.radviz.highlight(dataPoint);
        this.parallel.highlight(dataPoint);
        this.pie.Highlight(dataPoint.variety);
    }

    // Called when the mouse leaves a data point or line.
    onHoverExit() {
        this.radviz.clearHighlight();
        this.parallel.clearHighlight();
        this.pie.Unhighlight();
    }

    // Filtering via Pie Chart:
    // If clicking on the same variety again, resets the filter.
    Select(variety) {
        if (this.activeFilter === variety) {
            // Reset filter if the same variety is clicked again.
            this.filteredData = this.data.slice();
            this.activeFilter = null;
        } else {
            // Filter data by the selected variety.
            this.filteredData = this.data.filter(d => d.variety === variety);
            this.activeFilter = variety;
        }
        // Update each visualization with the new data.
        this.radviz.update(this.filteredData);
        this.parallel.update(this.filteredData);
        this.pie.update(this.filteredData, this.activeFilter);
    }

    // These two methods provide a uniform entry point for the visualizations on hover.
    onRadvizHover(dataPoint) {
        this.onHover(dataPoint);
    }

    onParaHover(dataPoint) {
        this.onHover(dataPoint);
    }
}