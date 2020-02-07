AGT-VIS 
--------------------------------------------------------

Version: 0.5.5

Purpose:
	The purpose of AGT-VIS is to get a visual sense of anomalous data, ie. Orphans and disconnected relationships, and 
	changes made to the data over time.
	

Technologies Used:
	WebGL - Html5 introduced the canvas element which allows browsers to use OpenGL ES (embedded systems) without the use of plug-ins. https://en.wikipedia.org/wiki/WebGL
	OpenGL ES 2.0 - Is a 2D and 3D graphics API for embedded systems. https://en.wikipedia.org/wiki/OpenGL_ES
	JSON - JavaScript Object Notation. https://en.wikipedia.org/wiki/JSON
	VivaGraph.JS - Is a JavaScript Graph Drawing Library made by Andrei Kashcha of Yasiv, using canvas and webgl. https://github.com/anvaka/VivaGraphJS


Controls:
	hold left mouse - used to pan left/right and up/down
	left click - selects a node (currently bugged)
	mouse wheel - zoom in/out
	
Search:
	Search uses jquery-ui autocomplete widget. At least 2 characters need to be typed before autocomplete starts.

Data Format:
	VivaGraph uses json to produce graphs. Using Nodes and Links to define the graph elements.
	
		Minimum to define and render a graph.
		
			var graph = Viva.Graph.graph();
			graph.addLink(1, 2);

			var renderer = Viva.Graph.View.renderer(graph);
			renderer.run();
			
			* Here addLink will create nodes 1 and 2, and will also link them together with an edge.
		
		
	Nodes:
		Nodes define a point in the graph. Created by the "addNode" function. Can be graphs.
		
		
	AddNode:
		addNode( id, "extra data")
			extra data: can be in json format or a value or string
				addNode( 'google', { id: 1, url: 'https://www.google.com' });
		
		
	AddLink:
		addLink( id1, id2 )
			Connects nodes id1 and id2 with an edge (line).
			Creates nodes if they are not already defined.
	
	
	Relation to AGT:
		AGT has the same concept of Nodes and Links in Objects and ObjectAssociations respectively.
		
		
Proposed Work:
	1) Optimize vertex and pixel shaders and texture loading.
	2) Define shape meanings. Currently: square, circle, triangle, plus, minus, star.
	3) Create json and graphs for incoming xml data.
	4) Create a time slider which marks changes over time by changing the color or adding/removing a node or link.
	5) Create comparisons of changes made by the incoming xml data to the current database.
	6) Show node and edge data in separate window on mouse click. (Rendering all node labels at once, greatly reduces performance)
	7) Allow autocomplete for GFMID's.
	8) Add legend for shape meanings.
	
	
Change Log:
05/05/2016
- added pause/play button
- added # Links popup dialog window that shows link data
- changed node colors from hex to a normalized array including alpha. From 0xFFA500 to [1.0, 0.5, 0.0, 1.0]
- added timeslider. Needs to be fixed

	