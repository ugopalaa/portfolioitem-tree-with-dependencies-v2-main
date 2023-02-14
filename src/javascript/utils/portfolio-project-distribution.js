Ext.define("Rally.app.widget.portfolioProjectDistribution",{
    extend: 'Rally.ui.chart.Chart',
    alias: 'widget.portfolioprojectdistribution',

    records: null,
    chartData: {},
    chartConfig: {
        chart: {
            type: 'pie'
        },
        title: {
            text: 'Feature Distribution across Teams',
            style: {
                color: '#444',
                fontFamily:'ProximaNova',
                textTransform: 'uppercase',
                fill:'#444'
            }
        },

        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>',
            style: {
                color: '#444',
                fontFamily:'ProximaNova',
                textTransform: 'uppercase',
                fill:'#444'
            }
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    style: {
                        color: '#444',
                        fontFamily:'ProximaNova',
                        textTransform: 'uppercase',
                        fill:'#444'
                    }
                }
            }
        },
    },
    
    constructor: function(config){
        
        if (config.title){
            this.chartConfig.title = config.title;
        }
        this.chartData = this._getChartData(config.records);
        console.log('chartData',this.chartData);
        this.callParent(arguments);
    },
    _getChartData: function(records) {

        var projectHash = _.reduce(records, function(h,r){
            var pName = r.get('Project').Name; 
            if (!h[pName]){ h[pName] = 0; }
            h[pName]++;
            return h;  
        },{});
        
        var series = {
            name: 'Teams',
            colorByPoint: true,
            data: []
        };
        _.each(projectHash, function(v,k){
            series.data.push({
                name: k,
                y: v 
            });
        });
        console.log('series',series);
        return {
            series:[series]
        };
    },


});