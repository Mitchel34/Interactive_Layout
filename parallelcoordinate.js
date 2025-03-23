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
        this.yScales["sepal.length"] = d3.scaleLinear()
            .domain([4, 8])
            .range([height, 0]);
        this.yScales["sepal.width"] = d3.scaleLinear()
            .domain([2, 4.5])
            .range([height, 0]);
        this.yScales["petal.length"] = d3.scaleLinear()
            .domain([1, 7])
            .range([height, 0]);
        this.yScales["petal.width"] = d3.scaleLinear()
            .domain([0, 2.5])
            .range([height, 0]);

        // Define an x scale for spreading out the dimensions
        this.xScale = d3.scalePoint()
            .domain(this.dimensions)
            .range([0, width])
            .padding(0);

        // Add the x-axis to the chart
        const xAxis = d3.axisBottom(this.xScale)
            .tickValues(this.dimensions);
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

        // Create a color scale based on variety
        this.colorScale = d3.scaleOrdinal()
            .domain(["Setosa", "Versicolor", "Virginica"])
            .range(["#E32636", "#5072A7", "#4CBB17"]);

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
            .attr("d", d => lineGenerator(
                this.dimensions.map(dim => [this.xScale(dim), this.yScales[dim](+d[dim])])
            ))
            .on("mouseover", (event, d) => {
                d3.select(event.currentTarget)
                  .raise()
                  .attr("stroke-width", 3);
                this.showTooltip(event, d);
                if (this.control && this.control.onParaHover) {
                    this.control.onParaHover(d);
                }
            })
            .on("mousemove", (event, d) => {
                this.moveTooltip(event, d);
            })
            .on("mouseout", (event, d) => {
                d3.select(event.currentTarget).attr("stroke-width", 1);
                this.hideTooltip();
            });
    }
    
    showTooltip(event, d) {
        // Create and display tooltip information for the hovered line
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
        this.tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px")
            .html(`${d.variety} - sep.l: ${d["sepal.length"]}, sep.w: ${d["sepal.width"]}, pet.l: ${d["petal.length"]}, pet.w: ${d["petal.width"]}`)
            .style("opacity", 1);
    }
    
    moveTooltip(event, d) {
        this.tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px");
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style("opacity", 0);
        }
    }
    
    highlight(dataPoint) {
        this.mainGroup.selectAll('.parallel-line')
            .attr('stroke', d => d === dataPoint ? 'black' : this.colorScale(d.variety))
            .attr('stroke-width', d => d === dataPoint ? 3 : 1.75);
    }

    clearHighlight() {
        this.mainGroup.selectAll('.parallel-line')
            .attr('stroke', d => this.colorScale(d.variety))
            .attr('stroke-width', 1.75);
    }

    update(filteredData) {
        this.data = filteredData;
        this.mainGroup.selectAll('.parallel-line').remove();
        this.drawLines(this.data);
    }
    
    // Additional interaction methods can be defined here as needed
}