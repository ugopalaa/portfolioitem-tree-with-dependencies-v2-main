Ext.define('Rally.apps.Legend',{
    extend: 'Ext.Component',
    alias: 'widget.legend',
    /**
     * @cfg {String}
     * define a width if necessary to fit where it's being used
     */
    width: '160px',
    /**
     * @cfg {String}
     * define a height if necessary to fit where it's being used
     */
    height: '160px',

    renderTpl: new Ext.XTemplate(
        '<tpl>',
        '<div class="legend-title">{title}</div>',
        '<tpl for="colors">',
            '<div class="legend"><span class="legend-dot {legendcls}"></span>{legendtext}</div>',
        '</tpl></tpl>'
    ),
    _buildLegendData: function(colorOption){
            var data = {
                title: colorOption,
                colors: []
            };
            if (colorOption === 'Implied State'){
                data.colors.push({legendcls: 'not-defined', legendtext: 'Not Defined' });
                data.colors.push({legendcls: 'not-started', legendtext: 'Not Started' });
                data.colors.push({legendcls: 'in-progress', legendtext: 'In Progress' });
                data.colors.push({legendcls: 'done', legendtext: 'Done' });
            }
            if (colorOption === 'Health Color by Count' || colorOption === "Health Color by Estimate"){
                data.colors.push({legendcls: 'health-white', legendtext: 'Not Started' });
                data.colors.push({legendcls: 'health-green', legendtext: 'On Track' });
                data.colors.push({legendcls: 'health-yellow', legendtext: 'At Risk' });
                data.colors.push({legendcls: 'health-red', legendtext: 'Late' });
                data.colors.push({legendcls: 'health-gray', legendtext: 'Complete' });
            }
           return data; 
    },
    constructor: function (config) {
        config = config || {};
       
        this.renderData = this._buildLegendData(config.title);
       
        this.mergeConfig(config);
        this.callParent([this.config]);
    }    
});