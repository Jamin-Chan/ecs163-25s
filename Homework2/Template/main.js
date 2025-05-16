const width = 1200;
const height = 800;

let scatterLeft = 0, scatterTop = 0;
let scatterMargin = {top: 10, right: 80, bottom: 30, left: 80},
    scatterWidth = 400 - scatterMargin.left - scatterMargin.right,
    scatterHeight = 350 - scatterMargin.top - scatterMargin.bottom;

let distrLeft = 400, distrTop = 0;
let distrMargin = {top:0, right: 80, bottom: 30, left: 80},
    distrWidth = 400 - distrMargin.left - distrMargin.right,
    distrHeight = 350 - distrMargin.top - distrMargin.bottom;

let schoolLeft = 0, schoolTop = 400;
let schoolMargin = {top: 10, right: 30, bottom: 30, left: 60},
    schoolWidth = width - schoolMargin.left - schoolMargin.right,
    schoolHeight = height-450 - schoolMargin.top - schoolMargin.bottom;

const margin = {top: 30, right: 10, bottom: 30, left: 10};
const plotHeight = 300;
const plotWidth = width - margin.left - margin.right;


// Load and process the data
d3.csv("student-mat.csv").then(rawData => {
    console.log("rawData", rawData);

    // Convert numeric fields
    rawData.forEach(function(d) {
        d.G1 = +d.G1;
        d.G2 = +d.G2;
        d.G3 = +d.G3;
        d.studytime = +d.studytime;
        d.absences = +d.absences;
        d.age = +d.age;
        d.failures = +d.failures;
        d.famrel = +d.famrel;
        d.freetime = +d.freetime;
        d.goout = +d.goout;
        d.Dalc = +d.Dalc;  // workday alcohol consumption
        d.Walc = +d.Walc;  // weekend alcohol consumption
    });

    console.log("processedData", rawData);
    const data = rawData;

    // Plot 1: Scatter Plot of Study Time vs Final Grade (G3)
    const svg = d3.select("svg");

    const g1 = svg.append("g")
                .attr("width", scatterWidth + scatterMargin.left + scatterMargin.right)
                .attr("height", scatterHeight + scatterMargin.top + scatterMargin.bottom)
                .attr("transform", `translate(${scatterMargin.left}, ${scatterMargin.top})`);

    // X label
    g1.append("text")
    .attr("x", scatterWidth / 2)
    .attr("y", scatterHeight + 50)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Weekly Study Time (hours)");

    // Y label
    g1.append("text")
    .attr("x", -(scatterHeight / 2))
    .attr("y", -40)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Final Grade (G3)");

    // X scale
    const x1 = d3.scaleLinear()
        .domain([0, d3.max(rawData, d => d.studytime)])
        .range([0, scatterWidth])
        .nice();

    const xAxisCall = d3.axisBottom(x1).ticks(5);
    g1.append("g")
        .attr("transform", `translate(0, ${scatterHeight})`)
        .call(xAxisCall);

    // Y scale
    const y1 = d3.scaleLinear()
        .domain([0, d3.max(rawData, d => d.G3)])
        .range([scatterHeight, 0])
        .nice();

    const yAxisCall = d3.axisLeft(y1).ticks(10);
    g1.append("g").call(yAxisCall);

    // Add circles
    g1.selectAll("circle")
        .data(rawData)
        .enter().append("circle")
        .attr("cx", d => x1(d.studytime))
        .attr("cy", d => y1(d.G3))
        .attr("r", 3)
        .attr("fill", "#69b3a2")
        .attr("opacity", 0.6);

    // Plot 2: Distribution of Absences
    const g2 = svg.append("g")
                .attr("width", distrWidth + distrMargin.left + distrMargin.right)
                .attr("height", distrHeight + distrMargin.top + distrMargin.bottom)
                .attr("transform", `translate(${distrLeft}, ${distrTop})`);

    // X label
    g2.append("text")
    .attr("x", distrWidth / 2)
    .attr("y", distrHeight + 50)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Number of Absences");

    // Y label
    g2.append("text")
    .attr("x", -(distrHeight / 2))
    .attr("y", -40)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Number of Students");

    // Create histogram for absences
    const histogram = d3.histogram()
        .value(d => d.absences)
        .domain([0, d3.max(rawData, d => d.absences)])
        .thresholds(20);

    const bins = histogram(rawData);

    // X scale
    const x2 = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.x1)])
        .range([0, distrWidth]);

    // Y scale
    const y2 = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([distrHeight, 0])
        .nice();

    // Add axes
    g2.append("g")
        .attr("transform", `translate(0, ${distrHeight})`)
        .call(d3.axisBottom(x2));

    g2.append("g")
        .call(d3.axisLeft(y2));

    // Add bars
    g2.selectAll("rect")
        .data(bins)
        .enter().append("rect")
        .attr("x", 1)
        .attr("transform", d => `translate(${x2(d.x0)}, ${y2(d.length)})`)
        .attr("width", d => x2(d.x1) - x2(d.x0) - 1)
        .attr("height", d => distrHeight - y2(d.length))
        .style("fill", "steelblue");

    // Plot 3: Parallel Coordinates Plot
    const parallelContainer = d3.select("#parallel");
    const parallelWidth = parallelContainer.node().getBoundingClientRect().width;
    const parallelHeight = parallelContainer.node().getBoundingClientRect().height;
    
    const svgParallel = parallelContainer
      .append("svg")
      .attr("width", parallelWidth)
      .attr("height", parallelHeight);
    
    const dimensions = ["age", "studytime", "failures", "absences", "famrel", "G3"];
    const schoolColor = { "GP": "#1f77b4", "MS": "#ff7f0e" };
    
    // Scales
    const yScales = {};
    dimensions.forEach(dim => {
      yScales[dim] = d3.scaleLinear()
        .domain(d3.extent(data, d => d[dim]))
        .range([parallelHeight - 30, 30]); // Inverted range
    });
    
    const xScaleParallel = d3.scalePoint()
      .domain(dimensions)
      .range([50, parallelWidth - 50]);
    
    // Draw lines
    const line = d3.line()
      .x(d => xScaleParallel(d.name))
      .y(d => yScales[d.name](d.value))
      .defined(d => !isNaN(d.value));
    
    // Store paths in a variable so we can update them later
    const paths = svgParallel.append("g")
      .attr("id", "parallel-lines")
      .selectAll("path")
      .data(data)
      .enter().append("path")
      .attr("d", d => line(dimensions.map(dim => ({ name: dim, value: d[dim] }))))
      .attr("stroke", d => schoolColor[d.school] || "#777")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.6)
      .attr("fill", "none");
      
    // Add axes for parallel coordinates
    dimensions.forEach(dim => {
      const axis = d3.axisLeft(yScales[dim]).ticks(5);
      svgParallel.append("g")
        .attr("transform", `translate(${xScaleParallel(dim)},0)`)
        .call(axis);
        
      // Add dimension labels
      svgParallel.append("text")
        .attr("x", xScaleParallel(dim))
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text(dim);
    });
    
    // Function to update parallel coordinate colors
    function updateParallelColor(category) {
        const uniqueValues = Array.from(new Set(data.map(d => d[category])));
        const colorScale = d3.scaleOrdinal()
          .domain(uniqueValues)
          .range(d3.schemeCategory10);
      
        // Update line colors using the paths variable we defined earlier
        paths.attr("stroke", d => colorScale(d[category]));
      
        // Remove old legend
        svgParallel.selectAll(".legend").remove();
      
        // Create new legend
        const legend = svgParallel.append("g")
          .attr("class", "legend")
          .attr("transform", `translate(${parallelWidth - 150}, 10)`);
      
        uniqueValues.forEach((value, i) => {
          legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)
            .attr("width", 0)
            .attr("height", 0)
            .attr("fill", colorScale(value));
      
        //   legend.append("text")
        //     .attr("x", 20)
        //     .attr("y", i * 20 + 12)
        //     .text(`${category}: ${value}`);
        });
    }
    
    // Initial update with 'school'
    updateParallelColor('school');
    
    // Event listener for the dropdown
    d3.select("#colorSelector").on("change", function() {
        const selectedCategory = this.value;
        updateParallelColor(selectedCategory);
    });

}).catch(function(error) {
    console.log(error);
});