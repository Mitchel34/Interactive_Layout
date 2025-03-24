class Para {
    constructor(data, control) {
        this.data = data;
        this.control = control;
        this.initialize();
    }
    
    initialize() {
        // Use the existing container instead of creating a new one
        this.container = d3.select("#parallel-container");
        this.chartContainer = this.container;

        // Define margins and dimensions based on container size
        const margin = this.control.margin || { top: 50, right: 200, bottom: 30, left: 50 },
              containerWidth = this.container.node().getBoundingClientRect().width,
              containerHeight = this.container.node().getBoundingClientRect().height,
              width = containerWidth - margin.left - margin.right,
              height = containerHeight - margin.top - margin.bottom;

        // Save dimensions for later (used by brushes)
        this.width = width;
        this.height = height;

        // Create an SVG inside the chart container
        this.svg = this.chartContainer
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight);

        // Create the main group element for the chart
        this.mainGroup = this.svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Define the dimensions to display
        this.dimensions = ["sepal.length", "sepal.width", "petal.length", "petal.width"];

        // Define y-scales for each dimension
        this.yScales = {};
        this.yScales["sepal.length"] = d3.scaleLinear().domain([4, 8]).range([height, 0]);
        this.yScales["sepal.width"] = d3.scaleLinear().domain([2, 4.5]).range([height, 0]);
        this.yScales["petal.length"] = d3.scaleLinear().domain([1, 7]).range([height, 0]);
        this.yScales["petal.width"] = d3.scaleLinear().domain([0, 2.5]).range([height, 0]);

        // Define an x scale for spreading out the dimensions
        this.xScale = d3.scalePoint()
            .domain(this.dimensions)
            .range([0, width])
            .padding(0);

        // Add the x-axis to the chart
        const xAxis = d3.axisBottom(this.xScale).tickValues(this.dimensions);
        this.mainGroup.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end");

        // Draw y-axes for each dimension with custom tick values
        this.dimensions.forEach(dim => {
            let tickValues;
            if (dim === "sepal.length") tickValues = [5, 6, 7];
            else if (dim === "sepal.width") tickValues = [2.0, 3.0, 4.0];
            else if (dim === "petal.length") tickValues = [1, 2, 3, 4, 5, 6];
            else if (dim === "petal.width") tickValues = [1, 2];

            const yAxis = d3.axisLeft(this.yScales[dim])
                .tickValues(tickValues)
                .tickFormat(d3.format(".1f"));

            this.mainGroup.append("g")
                .attr("class", `y-axis y-axis-${dim}`)
                .attr("transform", `translate(${this.xScale(dim)}, 0)`)
                .call(yAxis);
        });

        // Initialize brush selections storage
        this.brushSelections = {};

        // Add brushes to each axis for interactive filtering
        this.addBrushes();

        // Use the control's color scale instead of creating a new one
        this.colorScale = this.control.color;

        // Render all parallel coordinate lines
        this.drawLines(this.data);
    }

    drawLines(data) {
        // Create a line generator for the parallel coordinates
        const lineGenerator = d3.line().curve(d3.curveMonotoneX);
        this.lines = this.mainGroup.selectAll(".parallel-line")
            .data(data)
            .enter()
            .append("path")
            .attr("class", "parallel-line")
            .attr("fill", "none")
            .attr("stroke", d => this.colorScale(d.variety))
            .attr("stroke-width", 1.75)
            .attr("stroke-opacity", 0.5)
            .attr("d", d => lineGenerator(
                this.dimensions.map(dim => [this.xScale(dim), this.yScales[dim](+d[dim])])
            ))
            .on("mouseover", (event, d) => {
                d3.select(event.currentTarget).raise().attr("stroke-width", 3);
                this.showTooltip(event, d);
                this.control.onParaHover(d);
                // Set hovered line opacity to 0.9 and others to 0.1
                this.mainGroup.selectAll(".parallel-line")
                    .attr("stroke-opacity", currentData => currentData === d ? 0.9 : 0.1);
                // Highlight the corresponding RadViz circle and draw its polygon
                this.control.radviz.highlightFromParallel(d);
            })
            .on("mousemove", (event, d) => { this.moveTooltip(event, d); })
            .on("mouseout", (event, d) => {
                d3.select(event.currentTarget).attr("stroke-width", 1.75);
                this.hideTooltip();
                // Remove the polygon lines from RadViz on mouseout
                this.control.radviz.svg.selectAll(".highlight-polygon").remove();
                this.control.onHoverExit();
            });
    }
    
    showTooltip(event, d) {
        if (!this.tooltip) {
            this.tooltip = this.chartContainer.append("div")
                .attr("class", "para-tooltip")
                .style("position", "absolute")
                .style("background", "#fff")
                .style("border", "1px solid black")
                .style("padding", "4px")
                .style("pointer-events", "none")
                .style("opacity", 0);
        }
        // Compute midpoint of the line based on its dimensions
        const points = this.dimensions.map(dim => [this.xScale(dim), this.yScales[dim](+d[dim])]);
        const midX = d3.mean(points, p => p[0]);
        const midY = d3.mean(points, p => p[1]);
        const tooltipContent = this.dimensions.map(dim => `${dim}: ${d[dim]}`).join("<br>");
        // Position tooltip using the computed midpoint with a slight offset
        this.tooltip
            .style("left", (midX + 20) + "px")
            .style("top", (midY - 10) + "px")
            .html(`<strong>${d.variety}</strong><br>${tooltipContent}`)
            .style("opacity", 1);
    }
    
    moveTooltip(event, d) {
        // Recompute the midpoint to reposition tooltip as needed
        const points = this.dimensions.map(dim => [this.xScale(dim), this.yScales[dim](+d[dim])]);
        const midX = d3.mean(points, p => p[0]);
        const midY = d3.mean(points, p => p[1]);
        this.tooltip
            .style("left", (midX + 20) + "px")
            .style("top", (midY - 10) + "px");
    }
    
    hideTooltip() {
        if (this.tooltip) { this.tooltip.style("opacity", 0); }
    }
    
    highlight(dataPoint) {
        this.mainGroup.selectAll('.parallel-line')
            .attr('stroke', d => d === dataPoint ? 'black' : this.colorScale(d.variety))
            .attr('stroke-width', d => d === dataPoint ? 3 : 1.75)
            .attr('stroke-opacity', d => d === dataPoint ? 1 : 0.5);
    }

    clearHighlight() {
        this.mainGroup.selectAll('.parallel-line')
            .attr('stroke', d => this.colorScale(d.variety))
            .attr('stroke-width', 1.75)
            .attr('stroke-opacity', 0.5);
    }

    update(filteredData) {
        this.data = filteredData;
        this.mainGroup.selectAll('.parallel-line').remove();
        this.drawLines(this.data);
        // Note: The brush groups remain intact.
    }
    
    highlightBySpecies(species) {
        this.mainGroup.selectAll(".parallel-line")
            .attr("stroke-opacity", d => d.variety === species ? 1 : 0.1);
    }
    
    addBrushes() {
        this.dimensions.forEach(dim => {
            let brush = d3.brushY()
                .extent([[-10, 0], [10, this.height]])
                .on("brush end", (event) => { this.brushed(event, dim); });
            this.mainGroup.append("g")
                .attr("class", "brush brush-" + dim)
                .attr("transform", `translate(${this.xScale(dim)}, 0)`)
                .call(brush);
        });
    }

    brushed(event, dim) {
        let selection = event.selection;
        if (selection) { this.brushSelections[dim] = selection; }
        else { delete this.brushSelections[dim]; }

        const actives = Object.entries(this.brushSelections);
        if (actives.length === 0) {
            this.control.resetViews();
            return;
        }
        const filterFunc = d => {
            return actives.every(([dim, sel]) => {
                let value = +d[dim];
                let pos = this.yScales[dim](value);
                return pos >= sel[0] && pos <= sel[1];
            });
        };
        this.control.updateViews(filterFunc);
    }

    // New method: highlight only the corresponding parallel line.
    highlightSingle(selected) {
        this.mainGroup.selectAll(".parallel-line")
            .attr("stroke-opacity", d => d === selected ? 0.9 : 0.1);
        this.mainGroup.selectAll(".parallel-line")
            .each(function(d) { if(d === selected) d3.select(this).raise(); });
    }
    
    resetHighlight() {
        this.clearHighlight(); // Existing method resets all to 0.5 opacity.
    }
}
