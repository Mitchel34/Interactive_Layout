class Pie {
    constructor(data, w, h, con) {
        this.con = con;
        this.currentClicked = null; // Track the currently clicked section

        // Use the existing container
        const svg = d3.select("#pie-container")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "150%")  // Increased height for a taller piechart svg
            .append("g")
            .attr("transform", `translate(${w/4}, ${h/4})`);

        this.svg = svg;

        // Create pie layout
        const arrVariety = Array.from(new Set(data.map(x => x.variety)));
        const arrPie = d3.pie().value(d => data.filter(x => x.variety === d).length)(arrVariety);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(w, h) / 4 - 20);

        // Draw pie slices with toggling click.
        this.pie = svg.selectAll(".slice")
            .data(arrPie)
            .enter()
            .append("g")
            .attr("class", "slice")
            .on("click", (e, d) => {
                if (this.currentClicked === d.data) {
                    // Reset all sections to full opacity
                    this.pie.selectAll("path").attr("fill-opacity", 0.5);
                    this.currentClicked = null;
                    con.resetViews();
                } else {
                    // Highlight the clicked section and dim others
                    this.pie.selectAll("path")
                        .attr("fill-opacity", slice => (slice.data === d.data ? 1 : 0.2));
                    this.currentClicked = d.data;
                    con.updateViews(x => x.variety === d.data);
                }
            });

        this.pie.append("path")
            .attr("d", arc)
            .attr("fill", d => con.color(d.data))
            .attr("stroke", "black")
            .attr("fill-opacity", 0.5);

        this.pie.append("text")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .text(d => `${d.data}: ${d.value}`);
    }

    highlightBySpecies(species) {
        this.pie.selectAll("path")
            .attr("fill-opacity", d => d.data === species ? 1 : 0.2);
    }

    Unhighlight() {
        this.pie.selectAll('path')
            .attr('fill-opacity', 0.5);
    }

}