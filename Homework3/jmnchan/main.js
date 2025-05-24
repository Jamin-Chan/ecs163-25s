const width = 1200;
const height = 800;

let scatterLeft = 0, scatterTop = 0;
let scatterMargin = {top: 10, right: 80, bottom: 30, left: 80},
    scatterWidth = 400 - scatterMargin.left - scatterMargin.right,
    scatterHeight = 300 - scatterMargin.top - scatterMargin.bottom;

let distrLeft = 400, distrTop = 0;
let distrMargin = {top:0, right: 80, bottom: 30, left: 80},
    distrWidth = 400 - distrMargin.left - distrMargin.right,
    distrHeight = 300 - distrMargin.top - distrMargin.bottom;

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

    // Create main container for scatter plot
    const scatterContainer = svg.append("g")
        .attr("transform", `translate(${scatterMargin.left}, ${scatterMargin.top})`);

    // Create a clipping path to prevent elements from drawing outside the plot area
    svg.append("defs").append("clipPath")
        .attr("id", "scatter-clip")
        .append("rect")
        .attr("width", scatterWidth)
        .attr("height", scatterHeight);

    // Create the main plot area group
    const g1 = scatterContainer.append("g")
        .attr("clip-path", "url(#scatter-clip)");

    // Y scale (define this early as it's used in zoom)
    const y1 = d3.scaleLinear()
        .domain([0, d3.max(rawData, d => d.G3)])
        .range([scatterHeight, 0])
        .nice();

    // Variables to track current state for zoom
    let currentXVar = 'studytime';
    let currentXScale = d3.scaleLinear()
        .domain([0, d3.max(rawData, d => d.studytime)])
        .range([0, scatterWidth])
        .nice();

    // Create zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.5, 10])
        .extent([[0, 0], [scatterWidth, scatterHeight]])
        .translateExtent([[0, 0], [scatterWidth, scatterHeight]])
        .on("zoom", zoomed);

    // Create a transparent rectangle to capture zoom events
    const zoomRect = scatterContainer.append("rect")
        .attr("width", scatterWidth)
        .attr("height", scatterHeight)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(zoom);

    function zoomed(event) {
        // Get transformed scales
        const newXScale = event.transform.rescaleX(currentXScale);
        const newYScale = event.transform.rescaleY(y1);
        
        // Update x-axis
        scatterContainer.select('.x-axis')
            .call(d3.axisBottom(newXScale));
        
        // Update y-axis
        scatterContainer.select('.y-axis')
            .call(d3.axisLeft(newYScale));
        
        // Update circle positions
        g1.selectAll('circle')
            .attr('cx', d => newXScale(d[currentXVar]))
            .attr('cy', d => newYScale(d.G3));
    }

    // Add axes to the container (not the clipped group)
    scatterContainer.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${scatterHeight})`)
        .call(d3.axisBottom(currentXScale));

    scatterContainer.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y1));

    // Add labels to the container
    scatterContainer.append("text")
        .attr("class", "x-label")
        .attr("x", scatterWidth / 2)
        .attr("y", scatterHeight + 40)
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .text("Weekly Study Time (hours)");

    scatterContainer.append("text")
        .attr("class", "y-label")
        .attr("x", -(scatterHeight / 2))
        .attr("y", -40)
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Final Grade (G3)");

    // Add initial circles
    g1.selectAll("circle")
        .data(rawData)
        .enter().append("circle")
        .attr("cx", d => currentXScale(d.studytime))
        .attr("cy", d => y1(d.G3))
        .attr("r", 3)
        .attr("fill", "#69b3a2")
        .attr("opacity", 0.6);

      function updateScatter(xVar) {
        // Update current variable for zoom
        currentXVar = xVar;
        
        // Remove only circles from the clipped area
        g1.selectAll("circle").remove();

        // Update X scale and store it for zoom
        currentXScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d[xVar])])
            .range([0, scatterWidth])
            .nice();
    
        // Update X axis (it's in scatterContainer, not g1)
        scatterContainer.select('.x-axis')
            .transition().duration(500)
            .call(d3.axisBottom(currentXScale));

        // Update X label
        scatterContainer.select('.x-label')
            .transition().duration(500)
            .text(() => {
                const labels = {
                    studytime: "Weekly Study Time (hours)",
                    age: "Age",
                    failures: "Past Class Failures",
                    absences: "Number of Absences",
                    Dalc: "Workday Alcohol Consumption",
                    Walc: "Weekend Alcohol Consumption"
                };
                return labels[xVar];
            });
    
        // Animate circles
        g1.selectAll("circle")
            .data(data)
            .join(
                enter => enter.append("circle")
                    .attr("cx", d => currentXScale(d[xVar]))
                    .attr("cy", d => y1(d.G3))
                    .attr("r", 0)
                    .attr("fill", "#69b3a2")
                    .transition().duration(500)
                    .attr("r", 3)
                    .attr("opacity", 0.6),
                
                update => update
                    .transition().duration(500)
                    .attr("cx", d => currentXScale(d[xVar])),
                
                exit => exit.remove()
          );

          // Reset zoom transform when changing variables
          zoomRect.call(zoom.transform, d3.zoomIdentity);
      }

      // Initial plot
      updateScatter('studytime');
      
      // Event listener
      d3.select("#xAxis").on("change", function() {
          currentXVar = this.value;
          updateScatter(this.value);
      });

    // Plot 2: histogram
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
    // Add this function to handle histogram updates
    
    function updateHistogram(selectedVariable) {
      // Remove only specific elements instead of clearing entire group
      g2.selectAll("text").remove();
      g2.selectAll("g").remove();

      g2.append("text")
      .attr("x", -(distrHeight / 2))
      .attr("y", -40)
      .attr("font-size", "20px")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Number of Students");

      // Histogram calculations
      const histogram = d3.histogram()
          .value(d => d[selectedVariable])
          .domain([0, d3.max(rawData, d => d[selectedVariable])])
          .thresholds(20);
      const bins = histogram(rawData);
  
      // New scales
      const x2 = d3.scaleLinear()
          .domain([0, d3.max(bins, d => d.x1)])
          .range([0, distrWidth]);
  
      const y2 = d3.scaleLinear()
          .domain([0, d3.max(bins, d => d.length)])
          .range([distrHeight, 0])
          .nice();
  
      // Animate axes
      const xAxis = g2.append("g")
          .attr("class", "axis")
          .attr("transform", `translate(0, ${distrHeight})`)
          .style("opacity", 0)
          .transition()
          .duration(500)
          .style("opacity", 1)
          .call(d3.axisBottom(x2));
  
      const yAxis = g2.append("g")
          .attr("class", "axis")
          .style("opacity", 0)
          .transition()
          .duration(500)
          .style("opacity", 1)
          .call(d3.axisLeft(y2));
  
      // Animate labels
      g2.append("text")
          .attr("class", "x-label")
          .attr("x", distrWidth / 2)
          .attr("y", distrHeight + 50)
          .style("opacity", 0)
          .transition()
          .duration(500)
          .style("opacity", 1)
          .attr("font-size", "20px")
          .attr("text-anchor", "middle")
          .text(`Number of ${selectedVariable.charAt(0).toUpperCase() + selectedVariable.slice(1)}`);
  
      // Create tooltip div if it doesn't exist
      let tooltip = d3.select("body").select(".histogram-tooltip");
      if (tooltip.empty()) {
          tooltip = d3.select("body").append("div")
              .attr("class", "histogram-tooltip")
              .style("position", "absolute")
              .style("padding", "10px")
              .style("background", "rgba(0, 0, 0, 0.8)")
              .style("color", "white")
              .style("border-radius", "5px")
              .style("pointer-events", "none")
              .style("opacity", 0)
              .style("font-size", "12px");
      }

      // Animate bars
      const bars = g2.selectAll("rect")
          .data(bins, d => d.x0); // Use x0 as key
  
      // Exit animation
      bars.exit()
          .transition()
          .duration(300)
          .attr("height", 0)
          .attr("y", distrHeight)
          .style("opacity", 0)
          .remove();
  
      // Enter animation
      const barsEnter = bars.enter()
          .append("rect")
          .attr("x", 1)
          .attr("transform", d => `translate(${x2(d.x0)}, ${distrHeight})`)
          .attr("width", d => x2(d.x1) - x2(d.x0) - 1)
          .attr("height", 0)
          .style("fill", "steelblue")
          .style("opacity", 0)
          .style("cursor", "pointer");
  
      // Update animation and add click handlers
      bars.merge(barsEnter)
          .transition()
          .duration(500)
          .style("opacity", 1)
          .attr("transform", d => `translate(${x2(d.x0)}, ${y2(d.length)})`)
          .attr("width", d => x2(d.x1) - x2(d.x0) - 1)
          .attr("height", d => distrHeight - y2(d.length))
          .selection()
          .on("mouseover", function(event, d) {
              // Highlight the bar
              d3.select(this)
                  .style("fill", "#ff6b6b")
                  .style("opacity", 0.8);
              
              // Show tooltip
              const variableNames = {
                  absences: "Absences",
                  studytime: "Study Time",
                  age: "Age", 
                  failures: "Failures",
                  Dalc: "Workday Alcohol",
                  Walc: "Weekend Alcohol"
              };
              
              const varName = variableNames[selectedVariable] || selectedVariable;
              const rangeText = d.x0 === d.x1 - 1 ? 
                  `${d.x0}` : 
                  `${d.x0} - ${d.x1 - 1}`;
              
              tooltip.transition()
                  .duration(200)
                  .style("opacity", .9);
              tooltip.html(`
                  <strong>${varName}: ${rangeText}</strong><br/>
                  Students: ${d.length}<br/>
                  Click for details
              `)
                  .style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function(d) {
              // Reset bar color
              d3.select(this)
                  .style("fill", "steelblue")
                  .style("opacity", 1);
              
              // Hide tooltip
              tooltip.transition()
                  .duration(500)
                  .style("opacity", 0);
          })
          .on("click", function(event, d) {
              // Create detailed info modal
              showBinDetails(d, selectedVariable);
          });
    }

    // Function to show detailed information about a histogram bin
    function showBinDetails(bin, variable) {
        // Create modal if it doesn't exist
        let modal = d3.select("body").select(".histogram-modal");
        if (modal.empty()) {
            modal = d3.select("body").append("div")
                .attr("class", "histogram-modal")
                .style("position", "fixed")
                .style("top", "50%")
                .style("left", "50%")
                .style("transform", "translate(-50%, -50%)")
                .style("background", "white")
                .style("border", "2px solid #333")
                .style("border-radius", "10px")
                .style("padding", "20px")
                .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)")
                .style("z-index", "1000")
                .style("max-width", "500px")
                .style("max-height", "400px")
                .style("overflow-y", "auto");
        }

        // Clear previous content
        modal.html("");

        // Add close button
        modal.append("button")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "15px")
            .style("background", "none")
            .style("border", "none")
            .style("font-size", "20px")
            .style("cursor", "pointer")
            .style("color", "#666")
            .text("×")
            .on("click", function() {
                modal.style("display", "none");
            });

        // Variable name mapping
        const variableNames = {
            absences: "Absences",
            studytime: "Weekly Study Time (hours)",
            age: "Age",
            failures: "Past Class Failures",
            Dalc: "Workday Alcohol Consumption",
            Walc: "Weekend Alcohol Consumption"
        };

        const varName = variableNames[variable] || variable;
        const rangeText = bin.x0 === bin.x1 - 1 ? 
            `${bin.x0}` : 
            `${bin.x0} - ${bin.x1 - 1}`;

        // Add title
        modal.append("h3")
            .style("margin-top", "0")
            .style("color", "#333")
            .text(`${varName}: ${rangeText}`);

        // Add summary stats
        modal.append("p")
            .style("margin", "10px 0")
            .style("font-size", "16px")
            .html(`<strong>Number of students:</strong> ${bin.length}`);

        if (bin.length > 0) {
            // Calculate additional statistics for students in this bin
            const studentsInBin = bin;
            const avgG3 = d3.mean(studentsInBin, d => d.G3).toFixed(1);
            const avgAge = d3.mean(studentsInBin, d => d.age).toFixed(1);
            
            modal.append("p")
                .style("margin", "10px 0")
                .html(`<strong>Average Final Grade (G3):</strong> ${avgG3}`);
            
            modal.append("p")
                .style("margin", "10px 0")
                .html(`<strong>Average Age:</strong> ${avgAge}`);

            // Show school distribution
            const schoolCounts = d3.rollup(studentsInBin, v => v.length, d => d.school);
            const schoolInfo = Array.from(schoolCounts, ([school, count]) => 
                `${school}: ${count} students`).join(", ");
            
            modal.append("p")
                .style("margin", "10px 0")
                .html(`<strong>School Distribution:</strong> ${schoolInfo}`);

            // Show some individual student details if there aren't too many
            if (bin.length <= 10) {
                modal.append("h4")
                    .style("margin", "15px 0 10px 0")
                    .style("color", "#333")
                    .text("Student Details:");

                const table = modal.append("table")
                    .style("width", "100%")
                    .style("border-collapse", "collapse")
                    .style("margin-top", "10px");

                // Table header
                const header = table.append("thead").append("tr");
                ["School", "Age", "Final Grade", variable].forEach(col => {
                    header.append("th")
                        .style("border", "1px solid #ddd")
                        .style("padding", "8px")
                        .style("background-color", "#f2f2f2")
                        .style("font-size", "12px")
                        .text(col === variable ? varName : col);
                });

                // Table body
                const tbody = table.append("tbody");
                studentsInBin.forEach(student => {
                    const row = tbody.append("tr");
                    [student.school, student.age, student.G3, student[variable]].forEach(value => {
                        row.append("td")
                            .style("border", "1px solid #ddd")
                            .style("padding", "8px")
                            .style("text-align", "center")
                            .style("font-size", "12px")
                            .text(value);
                    });
                });
            } else {
                modal.append("p")
                    .style("margin", "15px 0")
                    .style("font-style", "italic")
                    .style("color", "#666")
                    .text(`Too many students to show individual details (${bin.length} students)`);
            }
        }

        // Show the modal
        modal.style("display", "block");

        // Add event listener to close modal when clicking outside
        d3.select("body").on("click.modal", function(event) {
            if (!modal.node().contains(event.target)) {
                modal.style("display", "none");
                d3.select("body").on("click.modal", null);
            }
        });
    }

// In the original data processing block, replace the histogram code with:
// Initial histogram
updateHistogram('absences');

// Add event listener for histogram selector
d3.select("#histogramSelector").on("change", function() {
  const selectedVariable = this.value;
  updateHistogram(selectedVariable);
});

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