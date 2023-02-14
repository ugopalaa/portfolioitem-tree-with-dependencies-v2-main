// const { __esModule } = require("./d3");

Ext.define("Rally.app.portfolioitem.PresentationPanel",{
    extend:  'Rally.ui.dialog.Dialog',

   autoShow: true,
   draggable: true,
   closable: true,
   // style: {
   //     border: "thick solid #000000"
   // },
   overflowY: 'scroll',
   overflowX: 'none',
   layout:'hbox',
   items: [
    {
        xtype: 'container',
        itemId: 'presentation',
        flex:1,
        padding: 10,
        height: "100%",
    }
   ],   
   record: null,
   model: null,
   childField: null,
   //width: 1200, 
   //height: 800,
   cardFieldDisplayList: null,
   notesFieldName: "KeyAccomplishmentsNextSteps",
   portfolioItemTypes: [],

   //Presentation panel settings 
   displayField: null,
   impactField: '',
   colHeader1: '',
   colHeader2: '',
   subtitle: '',
   node: null, 
   
   constructor: function(config) {
       this.mergeConfig(config);
       this.callParent([this.config]);
       this.setTitle(this.record.get('Name'));  
       this.updateDisplay();
   },
   updateDisplay: function(){
       console.log('updateDisplay',this.node);
       
       var renderData = this.decorateData(this.node);
       
       console.log('renderData',renderData)
       this.down('#presentation').removeAll();
       
       var tpl = new Ext.XTemplate(
           '<div class="title">{Name}</div>',
                '<div class="subtitle">{subtitle}</div>', 
                    '<table>', 
                        '<tr>', 
                            '<td style="vertical-align:top">',       
                                '<table class="presentationtable">',
                                    '<tr class="tableheader"><td class="tableheadercell">{colheader1}</td></tr>',
                                        '<tpl for="children">',     // interrogate the kids property within the data
                                            '<tr><td class="tablebodycell left">{Name}</td></tr>',
                                                //  '<tpl for="children">',
                                                //       '<tr><td class="tablebodycell left"><li>{Name}</td><td class="tablebodycell right">',
                                                //        '<tpl if="_impact"><li>{_impact}</tpl></td></tr>',
                                                //  '</tpl>',
                                        '</tpl>',
                                '</table>', 
                            '</td>',
                            '<td> ',          
                                '<div style="height: 250px; overflow: auto">',
                                    '<table class="presentationtable">',
                                        '<tr class="tableheader"><td class="tableheadercell">{colheader2}</td></tr>',
                                            '<tpl for="children">',     // interrogate the kids property within the data
                                                '<tr><td class="tablebodycell right">{_impact}</td></tr>',            
                                            '</tpl>',
                                    '</table>',
                                '</div>',
                            '</td>',
                        '</tr>',
                    '</table>'
       );
       
       tpl.overwrite(this.down('#presentation').getEl(),renderData);

       console.log(this.down('#presentation').getSize(),this.down('#presentation').getRegion(),this.getHeight())
   },

   decorateData: function(item){
       var renderData = item.data.record.getData(); 
       renderData.children = []; 

       //console.log('renderData ' , renderData.c_KeyAccomplishmentsNextSteps);
 
       renderData.subtitle = this.subtitle;
       renderData.colheader1 = this.colHeader1;
       renderData.colheader2 = this.colHeader2;
       renderData.impactField = this.impactField;

       //assign _impact field 
       var impactField = this.impactField,
           displayField = this.displayField; 
       
       if (!item.children){ item.children = []; }   
       var i=0;    
       for (i=0; i<item.children.length; i++){
              child = item.children[i].data.record.getData();
        //    child.children = [];
        //    if (item.children[i].children && item.children[i].children.length > 0){
        //        for (j=0; j<item.children[i].children.length; j++){
        //            var grandchild = item.children[i].children[j].data.record.getData();
        //            if (!displayField || child[displayField]){
        //                 grandchild._impact = grandchild[impactField] || "";
        //                 child.children.push(grandchild);
        //             }
        //        }
        //    }
           if (!displayField || child[displayField]){
                //child._impact = child[impactField] || ""; 
                if(i==0) {        
                    //console.log('adding key accompl');     
                    child._impact = renderData.c_KeyAccomplishmentsNextSteps;
                }
               renderData.children.push(child);              
           }
       }

       return renderData;
   }       
    
});
