class RadViz {
    constructor(data, control) {
        console.log("RadViz initialized with data:", data);
        this.data = data;
        this.control = control;

        // Initialize SVG container
        this.svg = d3.select("#radviz-container")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .append("g")
            .attr("transform", "translate(250, 250)"); // Adjust as needed

        this.radius = 200; // Define radius for RadViz circle
        this.initialize();
    }

    initialize() {
        if (!this.data.columns) {
            // Set columns based on the keys of the first row from iris.csv
            this.data.columns = Object.keys(this.data[0]);
        }

        const arrDimension = this.data.columns.slice(1, 5);

        // Use the control's color scale instead of creating a new one
        this.color = this.control.color;

        // Create a scale for anchor placement
        const scaleAnchors = d3.scaleBand()
            .domain(arrDimension)
            .range([0, 2 * Math.PI]);

        // Draw dashed axes
        this.svg.selectAll(".axis")
            .data(arrDimension)
            .enter()
            .append("line")
            .attr("class", "axis")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", d => this.radius * Math.cos(scaleAnchors(d) - Math.PI / 2))
            .attr("y2", d => this.radius * Math.sin(scaleAnchors(d) - Math.PI / 2))
            .attr("stroke", "black")
            .attr("stroke-dasharray", "4 4");

        // Add labels to the axes
        this.svg.selectAll(".label")
            .data(arrDimension)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => (this.radius + 10) * Math.cos(scaleAnchors(d) - Math.PI / 2))
            .attr("y", d => (this.radius + 10) * Math.sin(scaleAnchors(d) - Math.PI / 2))
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .text(d => d);

        // Draw the main RadViz circle
        this.svg.append("circle")
            .attr("r", this.radius)
            .attr("fill", "none")
            .attr("stroke", "black");

        // Plot data points
        this.svg.selectAll(".data-point")
            .data(this.data)
            .enter()
            .append("circle")
            .attr("class", "data-point")
            .attr("r", 5)
            .attr("fill", d => this.color(d.variety))
            .attr("fill-opacity", 0.8) // Set opacity to 0.8
            .attr("cx", d => {
                const normValues = arrDimension.map(dim => +d[dim]);
                const sum = d3.sum(normValues);
                return d3.sum(arrDimension.map(dim => (d[dim] / sum) * this.radius * Math.cos(scaleAnchors(dim) - Math.PI / 2)));
            })
            .attr("cy", d => {
                const normValues = arrDimension.map(dim => +d[dim]);
                const sum = d3.sum(normValues);
                return d3.sum(arrDimension.map(dim => (d[dim] / sum) * this.radius * Math.sin(scaleAnchors(dim) - Math.PI / 2)));
            })
            .on("mouseover", (event, d) => {
                this.showTooltip(event, d);
                this.control.onRadvizHover(d);
            })
            .on("mousemove", (event, d) => {
                this.moveTooltip(event, d);
            })
            .on("mouseout", () => {
                this.hideTooltip();
                this.control.onHoverExit();
            });
    }
    
    showTooltip(event, d) {
        // Create and display a tooltip with information about the data point
        if (!this.tooltip) {
            this.tooltip = d3.select("#radviz-container").append("div") // Use selector instead of this.container
                .attr("class", "radviz-tooltip")
                .style("position", "absolute")
                .style("background", "#fff")
                .style("border", "1px solid black")
                .style("padding", "4px")
                .style("pointer-events", "none")
                .style("opacity", 0);
        }
        const arrDimension = this.data.columns.slice(1, 5);
        this.tooltip
            .style("left", (event.pageX + 10) + "px") // Change offsetX to pageX for consistent behavior
            .style("top", (event.pageY + 10) + "px") // Change offsetY to pageY
            .html(`${d.variety} - ${arrDimension.map(dim => `${dim}: ${d[dim]}`).join(", ")}`)
            .style("opacity", 1);
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style("opacity", 0);
        }
    }
    
    moveTooltip(event, d) {
        if (this.tooltip) {
            this.tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        }
    }
    
    highlight(dataPoint) {
        this.svg.selectAll('.data-point')
            .attr('stroke', d => d === dataPoint ? 'black' : 'none')
            .attr('stroke-width', d => d === dataPoint ? 2 : 0);
    }

    clearHighlight() {
        this.svg.selectAll('.data-point')
            .attr('stroke', 'none')
            .attr('stroke-width', 0);
    }

    update(filteredData) {
        // Update data and re-render the RadViz.
        this.data = filteredData;
        this.svg.selectAll('.data-point').remove();
        this.initialize();
    }
    
    // Additional interaction methods can be defined here as needed
}