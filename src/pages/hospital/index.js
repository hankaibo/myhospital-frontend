import React, { Component, createRef } from 'react';
import { Select } from 'antd';
import { connect } from 'umi';
import Map from 'ol/Map';
import View from 'ol/View';
import { XYZ, Vector as VectorSource, Cluster } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { ZoomToExtent, defaults as defaultControls } from 'ol/control';
import { Draw, Modify, Snap } from 'ol/interaction';
import Feature from 'ol/Feature';
import Overlay from 'ol/Overlay';
import { Fill, Stroke, Style, Icon, Circle as CircleStyle } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import Point from 'ol/geom/Point';
import 'ol/ol.css';

const { Option } = Select;

// 瓦片图层
const rasterLayer = new TileLayer({
  source: new XYZ({
    // 高德
    url: 'https://webrd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&scl=1&x={x}&y={y}&z={z}',
    // crossOrigin: '',
  }),
});
rasterLayer.set('name', 'rasterLayer');

// 矢量图层
const vectorSource = new VectorSource({
  wrapX: true,
});
const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: new Style({
    fill: new Fill({
      color: 'rgba(155, 211, 229,0.5)',
    }),
    stroke: new Stroke({
      color: 'rgba(49, 143, 227,1)',
      width: 1,
    }),
  }),
});
vectorLayer.set('name', 'vectorLayer');

// 矢量图层（标记）
const markerVectorSource = new VectorSource({
  wrapX: true,
});
const markerVectorLayer = new VectorLayer({
  source: markerVectorSource,
});
markerVectorLayer.set('name', 'markerVectorLayer');

// 聚合
const clusterSource = new Cluster({
  distance: 40,
  source: vectorSource,
});
const styleCache = {};
// eslint-disable-next-line no-unused-vars
const clusterLayer = new VectorLayer({
  source: clusterSource,
  style(feature) {
    const size = feature.get('features').length;
    let style = styleCache[size];
    if (!style) {
      style = new Style({
        fill: new Fill({
          color: 'rgba(155, 211, 229,0.5)',
        }),
        stroke: new Stroke({
          color: 'rgba(49, 143, 227,1)',
          width: 1,
        }),
        image: new CircleStyle({
          radius: 10,
          stroke: new Stroke({
            color: '#fff',
          }),
          fill: new Fill({
            color: '#3399cc',
          }),
        }),
        text: new Text(size.toString()),
      });
      styleCache[size] = style;
    }
    return style;
  },
});

class Hospital extends Component {
  constructor(props) {
    super(props);
    this.state = {
      type: 'Circle',
    };
    this.olRef = createRef();
    this.popupRef = createRef();
    this.map = undefined;
    this.modify = undefined;
    this.draw = undefined;
    this.snap = undefined;
    this.beforeFeatureList = [];
    this.beforeCenter = [];
    this.beforeRadius = 0;
  }

  componentDidMount() {
    this.handleLocation();
    // 初始化地图
    this.map = new Map({
      target: this.olRef.current,
      layers: [rasterLayer, vectorLayer, markerVectorLayer],
      view: new View({
        // projection: 'EPSG:4326',
        center: fromLonLat([116.397507, 39.908708]), // 默认北京
        zoom: 13,
        minZoom: 0,
        maxZoom: 18,
        constrainResolution: true,
      }),
      controls: defaultControls().extend([
        new ZoomToExtent({
          extent: [12879665.084781753, 4779131.18122614, 13068908.219130317, 5101248.438166104],
        }),
      ]),
    });

    this.popup = new Overlay({
      element: this.popupRef.current,
      positioning: 'bottom-center',
      stopEvent: true,
      offset: [0, 0],
    });

    this.map.addOverlay(this.popup);

    // 添加交互功能
    this.addInteractions();
    // 添加修改功能
    this.modify = new Modify({ source: vectorSource });
    this.modify.on('modifystart', ({ features }) => {
      // eslint-disable-next-line no-underscore-dangle
      const feature = features.array_[0];
      const geometry = feature.getGeometry();
      this.beforeCenter = geometry.getCenter();
      this.beforeRadius = geometry.getRadius();
      this.beforeFeatureList = markerVectorSource
        .getFeatures()
        .filter((item) => geometry.intersectsCoordinate(item.getGeometry().getCoordinates()));
    });
    this.modify.on('modifyend', ({ features }) => {
      // eslint-disable-next-line no-underscore-dangle
      const feature = features.array_[0];
      const geometry = feature.getGeometry();
      if (geometry.getType() === 'Circle') {
        const center = geometry.getCenter();
        const radius = geometry.getRadius();
        // drag
        if (this.beforeCenter.toString() !== center.toString()) {
          this.beforeFeatureList.forEach((item) => {
            if (!geometry.intersectsCoordinate(item.getGeometry().getCoordinates())) {
              markerVectorSource.removeFeature(item);
            }
          });
          this.handleFetch({
            type: 'Circle',
            center: toLonLat(center),
            radius,
          });
        } else if (radius > this.beforeRadius) {
          this.handleFetch({
            type: 'Circle',
            center: toLonLat(center),
            radius,
          });
        } else {
          this.beforeFeatureList.forEach((item) => {
            if (!geometry.intersectsCoordinate(item.getGeometry().getCoordinates())) {
              markerVectorSource.removeFeature(item);
            }
          });
        }
      }
    });
    this.map.addInteraction(this.modify);
  }

  shouldComponentUpdate(nextProps) {
    return this.props.list !== nextProps.list;
  }

  componentDidUpdate() {
    const { list } = this.props;
    this.addMarker(list);
  }

  componentWillUnmount() {
    this.map.setTarget(undefined);
  }

  /**
   * 获取用户当前位置
   */
  handleLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { longitude, latitude } = position.coords;
        this.map.getView().animate({ center: fromLonLat([longitude, latitude]) });
      });
    }
  };

  /**
   * 根据坐标范围查询医院数据
   * @param params
   */
  handleFetch = (params) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'hospital/fetch',
      payload: {
        ...params,
      },
    });
  };

  /**
   * 根据查询到的医院数据添加地图标记
   * @param list
   */
  addMarker = (list) => {
    list.forEach((item, i) => {
      const iconFeature = new Feature({
        geometry: new Point(fromLonLat(item.lngLat)),
      });

      const iconStyle = new Style({
        image: new Icon({
          anchor: [0.5, 0.96],
          size: [44, 64],
          // padding-top: 8
          // padding-left: 19
          // padding-right: 45
          // padding-bottom:24
          offset: [19 + 88 * i, 8 + 88 * 3],
          // 1-10蓝标: [19+88*i,8+88*1]
          // 11-20蓝标：[19+88*i,8+88*2]
          // 1-10红标: [19+88*i,8+88*3]
          // 11-20红标：[19+88*i,8+88*4]
          // 1-10黄标: [19+88*i,8+88*5]
          src: './poi-marker.png',
        }),
      });
      iconFeature.setStyle(iconStyle);
      markerVectorSource.addFeature(iconFeature);
    });
  };

  /**
   * 切换绘制图形，并删除旧添加新交互功能。
   * @param value
   */
  handleType = (value) => {
    this.setState(
      {
        type: value,
      },
      () => {
        this.map.removeInteraction(this.draw);
        this.map.removeInteraction(this.snap);
        this.addInteractions();
      },
    );
  };

  /**
   * 地图交互功能实现及监听定义，带吸符功能。
   */
  addInteractions = () => {
    const { type } = this.state;
    this.draw = new Draw({
      source: vectorSource,
      type,
    });
    this.draw.on('drawend', ({ feature }) => {
      const params = {};
      const geometry = feature.getGeometry();
      if (geometry.getType() === 'Circle') {
        const center = feature.getGeometry().getCenter();
        const radius = feature.getGeometry().getRadius();
        params.center = toLonLat(center);
        params.radius = radius;
      }
      // 其它图形……
      this.handleFetch({
        type,
        ...params,
      });
    });
    this.map.addInteraction(this.draw);
    this.snap = new Snap({ source: vectorSource });
    this.map.addInteraction(this.snap);
  };

  foo = () => {
    const that = this;
    this.map.on('click', (evt) => {
      const selectedFeature = that.map.forEachFeatureAtPixel(
        evt.pixel,
        (feature) => {
          return feature;
        },
        {
          layerFilter: (layer) => {
            return layer.get('name') === 'vectorLayer';
          },
        },
      );
      if (selectedFeature) {
        const coordinates = selectedFeature.getGeometry().getCoordinates();
        that.popup.setPosition(fromLonLat(coordinates));
        console.log('show');
      } else {
        console.log('hidden');
      }
    });

    this.map.on('pointermove', (e) => {
      if (e.dragging) {
        return;
      }
      const hit = this.map.hasFeatureAtPixel(e.pixel, {
        layerFilter: (layer) => {
          return layer.get('name') === 'vectorLayer';
        },
      });
      this.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });
  };

  render() {
    const { type } = this.state;
    return (
      <div style={{ position: 'relative' }}>
        <div ref={this.olRef} style={{ height: '100vh' }}>
          <div ref={this.popupRef} />
        </div>
        <div style={{ position: 'absolute', top: '.5em', right: '.5em' }}>
          <Select defaultValue={type} style={{ width: 120 }} onChange={(value) => this.handleType(value)}>
            <Option value="Circle">圆形</Option>
            <Option value="Polygon" disabled>
              多边形
            </Option>
          </Select>
        </div>
      </div>
    );
  }
}

export default connect(({ hospital: { list }, loading }) => ({
  list,
  loading: loading.effects['hospital/fetch'],
}))(Hospital);
