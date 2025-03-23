class Pie {
    constructor(data, w, h, con) {
        this.con = con;

        // Use the existing container
        const svg = d3.select("#pie-container")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .append("g")
            .attr("transform", `translate(${w/4}, ${h/4})`); // Adjust translation to center in the container

        this.svg = svg;

        // Create pie layout
        const arrVariety = Array.from(new Set(data.map(x => x.variety)));
        const arrPie = d3.pie().value(d => data.filter(x => x.variety === d).length)(arrVariety);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(w, h) / 2 - 20);

        // Draw pie slices
        this.pie = svg.selectAll(".slice")
            .data(arrPie)
            .enter()
            .append("g")
            .attr("class", "slice")
            .on("click", (e, d) => {
                con.Select(d.data);
            });

        this.pie.append("path")
            .attr("d", arc)
            .attr("fill", d => con.color(d.data))
            .attr("stroke", "black");

        this.pie.append("text")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .text(d => `${d.data}: ${d.value}`);
    }

    // Highlight the slice for the specified variety.
    Highlight(variety) {
        this.pie.selectAll('path')
            .attr('fill-opacity', d => d.data === variety ? 1 : 0.2);
    }

    // Reset the highlighting.
    Unhighlight() {
        this.pie.selectAll('path')
            .attr('fill-opacity', 1);
    }

    // Update the pie chart when data changes or filtering is applied.
    update(filteredData, activeFilter) {
        const margin = this.con.margin;
        const w = +this.con.root.style("width").replace("px", "");
        const h = +this.con.root.style("height").replace("px", "");
        const size = {
            width: w,
            height: h,
            margin: margin
        };

        // Updating pie layout with filtered data.
        const arrVariety = Array.from(new Set(filteredData.map(x => x.variety)));
        const arrPie = d3.pie().value(d => filteredData.filter(x => x.variety === d).length)(arrVariety);
        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(size.width / 2 - margin.left);

        // Bind the new data.
        this.pie = this.svg.selectAll('g.slice')
            .data(arrPie);

        // Update existing slices.
        this.pie.select('path')
            .transition().duration(500)
            .attr('d', arc)
            .attr('fill', d => this.con.color(d.data))
            .attr('stroke', 'black');

        this.pie.select('text')
            .transition().duration(500)
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .text(d => `${d.data}: ${d.value}`);

        // If a filter is active, highlight that slice.
        if (activeFilter) {
            this.Highlight(activeFilter);
        } else {
            this.Unhighlight();
        }
    }
}