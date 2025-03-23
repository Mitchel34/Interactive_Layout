class Pie {
    constructor(data, w, h, con) {
        this.con = con;

        // use the private variable size to setup this pie chart
        const size = {
            width: w,
            height: h,
            margin: con.margin,     // margin is defined in the control object
            padding: con.margin/10
        }

        // create a dive and an svg according to the size passed by the control object
        const svg = con.root.append('div')
            .attr('id', 'radviz')
            .style('width', `${size.width}px`)
            .style('height', `${size.height}px`)
        .append('svg')
            .attr('width', size.width)
            .attr('height', size.height)
        .append('g')        // similar to RadViz, I move the origin to the center of the svg
            .attr('transform', `translate(${size.width/2}, ${size.height/2})`);

    
        const arrVariety = Array.from(new Set(data.map(x => x.variety)));

        // create the pie chart data according to how many data points for each variety
        const arrPie = d3.pie().value(d => data.filter(x => x.variety === d).length)(arrVariety);
        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(size.width / 2 - size.margin);

        // create the pie chart
        // create a container for each pie slice and bind the data
        this.pie = svg.selectAll('g')
            .data(arrPie)
            .join('g')
            .on('click', (e, d) => {
                // when clicking on a pie slice, call the Select method in the control object with the current variety
                con.Select(d.data);
            })
        // create the pie slice and text for each data point
        this.pie.append('path')
            .attr('d', arc)
            .attr('fill', d => con.color(d.data))   // color scale is defined in the control object
            .attr('stroke', 'black');

        this.pie.append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .text(d => `${d.data}: ${d.value}`)
            .style('font-size', '1.5em');
    }

    // all these methods will be called by the control object
    // define the method Highlight to respond to the hovering event
    Highlight(d) {
        this.pie.attr('fill-opacity', e=>e.data===d ? 1 : 0.2)
    }

    // define the method Unhighlight to reset the pie chart when the mouse leaves
    Unhighlight(){
        this.pie.attr('fill-opacity', 1);
    }
}