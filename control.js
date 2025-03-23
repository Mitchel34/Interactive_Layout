class Control {
    constructor(data) {
        const size = {
            /*
            Define the size of the layout here
            */
        };

        // Create the root container, use <d3 selection>.style to set up the size in CSS
        // It's a public variable. Other classes can access it to append their own div and svg
        this.root = d3.select('body').append('div')
            .attr('id', 'root')
            .style('width', '?')
            .style('height', '?');

        /* 
        Define public variables that can be used with multiple classes, such as color scale, dimension array
        */

        /*
        Create the instance for each class here
        Need to pass data, size, and this control object to each class
        For example, 
            this.Pie = new Pie(data, width(defined in size), height(defined in size), this);
        Set up the CSS for size and layout in the style.css file
        */
    }

    /* 
    Define methods here to respond to the mouse operation (will be called by each visualization class)
    When theses methods are called, call corresponding methods in each visualization class to update the chart
    */
}