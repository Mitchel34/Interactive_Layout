class RadViz {
    constructor(data, control) {
        console.log("RadViz initialized with data:", data);
        this.data = data;
        this.control = control;

        const container = d3.select("#radviz-container").node().getBoundingClientRect();
        const centerX = container.width / 2;
        const centerY = container.height / 2;

        // Initialize SVG container
        this.svg = d3.select("#radviz-container")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .append("g")
            .attr("transform", `translate(${centerX}, ${centerY})`);

        this.radius = 160; // Reduce radius for RadViz circle
        this.initialize();
    }

    initialize() {
        if (!this.data.columns) {
            this.data.columns = Object.keys(this.data[0]);
        }

        const arrDimension = this.data.columns.slice(1, 5);
        this.color = this.control.color;

        const scaleAnchors = d3.scaleBand()
            .domain(arrDimension)
            .range([-Math.PI / 4, Math.PI * 7 / 4]);

        // Store for later use
        this.arrDimension = arrDimension;
        this.scaleAnchors = scaleAnchors;

        // Draw dashed axes
        this.svg.selectAll(".axis")
            .data(arrDimension)
            .enter()
            .append("line")
            .attr("class", "axis")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", d => this.radius * Math.cos(scaleAnchors(d)))
            .attr("y2", d => this.radius * Math.sin(scaleAnchors(d)))
            .attr("stroke", "black")
            .attr("stroke-dasharray", "4 4");

        // Add labels to the axes
        this.svg.selectAll(".label")
            .data(arrDimension)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => (this.radius + 10) * Math.cos(scaleAnchors(d)))
            .attr("y", d => (this.radius + 10) * Math.sin(scaleAnchors(d)))
            .attr("text-anchor", (d, i) => i > 1 ? "end" : "start")
            .attr("alignment-baseline", "middle")
            .text(d => d);

        // Draw the main RadViz circle
        this.svg.append("circle")
            .attr("r", this.radius)
            .attr("fill", "none")
            .attr("stroke", "black");

        // Plot data points
        const objDimScale = arrDimension.reduce((acc, dim) => ({
            ...acc,
            [dim]: d3.scaleLinear()
                .domain(d3.extent(this.data, d => +d[dim]))
                .range([0, 1])
        }), {});

        this.objDimScale = objDimScale;

        this.svg.selectAll(".data-point")
            .data(this.data)
            .enter()
            .append("circle")
            .attr("class", "data-point")
            .attr("r", 5)
            .attr("fill", d => this.color(d.variety))
            .attr("fill-opacity", 0.5)
            .attr("cx", d => {
                const normValues = arrDimension.map(dim => objDimScale[dim](+d[dim]));
                const sumNorm = d3.sum(normValues);
                return d3.sum(arrDimension.map(dim => normValues[arrDimension.indexOf(dim)] * this.radius * Math.cos(scaleAnchors(dim)))) / sumNorm;
            })
            .attr("cy", d => {
                const normValues = arrDimension.map(dim => objDimScale[dim](+d[dim]));
                const sumNorm = d3.sum(normValues);
                return d3.sum(arrDimension.map(dim => normValues[arrDimension.indexOf(dim)] * this.radius * Math.sin(scaleAnchors(dim)))) / sumNorm;
            })
            .on("mouseover", (event, d) => {
                this.showTooltip(event, d);
                this.control.highlightViews(d.variety);
                this.svg.selectAll(".data-point")
                    .attr("fill-opacity", point => point === d ? 0.9 : 0.1);
                this.removeHighlightLine();
                let points = this.arrDimension.map(dim => {
                    let norm = this.objDimScale[dim](+d[dim]);
                    return [this.radius * Math.cos(this.scaleAnchors(dim)) * norm, this.radius * Math.sin(this.scaleAnchors(dim)) * norm];
                });
                this.svg.append("polygon")
                    .attr("class", "highlight-polygon")
                    .attr("points", points.map(p => p.join(",")).join(" "))
                    .attr("stroke", this.color(d.variety))
                    .attr("stroke-width", 2)
                    .attr("fill", this.color(d.variety))
                    .attr("fill-opacity", 0.2)
                    .style("pointer-events", "none"); // Prevent polygon from capturing mouse events
                this.svg.selectAll(".polygon-label")
                    .data(points)
                    .enter()
                    .append("text")
                    .attr("class", "polygon-label")
                    .attr("x", (p, i) => p[0])
                    .attr("y", (p, i) => p[1])
                    .attr("dy", "-0.5em")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "10px")
                    .attr("fill", "black")
                    .style("pointer-events", "none") // Disable pointer events on labels too
                    .text((p, i) => `${d[this.arrDimension[i]]}`);
                this.control.parallel.highlightSingle(d);
                const values = this.arrDimension.map(dim => `${dim}: ${d[dim]}`).join("<br>");
                this.tooltip.html(`<strong>${d.variety}</strong><br>${values}`)
                    .style("opacity", 1);
            })
            .on("mousemove", (event, d) => { this.moveTooltip(event, d); })
            .on("mouseout", () => {
                this.hideTooltip();
                this.removeHighlightLine();
                // Remove highlight polygon and labels
                this.svg.selectAll(".highlight-polygon").remove();
                this.svg.selectAll(".polygon-label").remove();
                // Reset opacity of all circles
                this.svg.selectAll(".data-point")
                    .attr("fill-opacity", 0.5);
                this.control.parallel.resetHighlight();
                this.control.onHoverExit();
            })
            .on("click", (event, d) => { 
                // Bring the clicked circle to the front for improved consistency
                d3.select(event.currentTarget).raise();
                this.control.updateViews(x => x.variety === d.variety);
            });
    }
    
    showTooltip(event, d) {
        if (!this.tooltip) {
            this.tooltip = d3.select("#radviz-container").append("div")
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
            .style("left", (event.pageX + 15) + "px")   // tooltip shifted right by 15px
            .style("top", (event.pageY - 15) + "px")    // tooltip shifted up by 15px
            .html(`${d.variety} - ${arrDimension.map(dim => `${dim}: ${d[dim]}`).join(", ")}`)
            .style("opacity", 1);
    }
    
    hideTooltip() {
        if (this.tooltip) { this.tooltip.style("opacity", 0); }
    }
    
    moveTooltip(event, d) {
        if (this.tooltip) {
            this.tooltip
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 15) + "px");
        }
    }
    
    update(filteredData) {
        this.data = filteredData;
        this.svg.selectAll('.data-point').remove();
        this.initialize();
    }
    
    highlightBySpecies(species) {
        this.svg.selectAll(".data-point")
            .attr("fill-opacity", d => d.variety === species ? 1 : 0.1);
    }

    // New helper method to reset highlighting.
    unhighlight() {
        // Reset data point opacity and remove polygon highlights and labels
        this.svg.selectAll(".data-point")
            .attr("fill-opacity", 0.5);
        this.svg.selectAll(".highlight-polygon").remove();
        this.svg.selectAll(".polygon-label").remove();
    }

    removeHighlightLine() {
        this.svg.selectAll(".highlight-line").remove();
    }
    
    // New helper method to highlight a circle from parallel coordinates hover 
    highlightFromParallel(d) {
        // Remove existing polygon highlights and labels
        this.svg.selectAll(".highlight-polygon").remove();
        this.svg.selectAll(".polygon-label").remove();
        // Set the corresponding circle to 0.9 and others to 0.1
        this.svg.selectAll(".data-point")
            .attr("fill-opacity", point => point === d ? 0.9 : 0.1);
        // Compute polygon points based on d
        let points = this.arrDimension.map(dim => {
            let norm = this.objDimScale[dim](+d[dim]);
            return [this.radius * Math.cos(this.scaleAnchors(dim)) * norm, this.radius * Math.sin(this.scaleAnchors(dim)) * norm];
        });
        // Draw polygon connecting anchors for the hovered data point
        this.svg.append("polygon")
            .attr("class", "highlight-polygon")
            .attr("points", points.map(p => p.join(",")).join(" "))
            .attr("stroke", this.color(d.variety))
            .attr("stroke-width", 2)
            .attr("fill", this.color(d.variety))
            .attr("fill-opacity", 0.2);
        // Add text labels at the corners of the polygon (displaying only the numeric value)
        this.svg.selectAll(".polygon-label")
            .data(points)
            .enter()
            .append("text")
            .attr("class", "polygon-label")
            .attr("x", (p, i) => p[0])
            .attr("y", (p, i) => p[1])
            .attr("dy", "-0.5em")
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "black")
            .text((p, i) => d[this.arrDimension[i]]);
    }
}
