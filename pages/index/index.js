let 
index = 0,    // 记录当前选中的图片数组下标
cars = [],    // 全局图片数组
carId = 0;    // 图片id
const 
carImgSrc = '/images/car.png',        // 车辆图片路径
SCALE_MAX = 1, SCALE_MIN = 0.5,       // 缩放比例范围
CAR_SPEED = 1.0,                      // 车辆控制速度指数（rpx）
CAR_SPL = 30,                         // 车辆控制灵敏度（ms）
CAR_MAX_COUNT = 3,                    // 最大车辆个数
canvasPre = 1,                        // 展示的canvas占mask的百分比
maskCanvas = wx.createCanvasContext('maskCanvas');
const carRawData = {
  top: 0,
  left: 0,
  angle: 0,
}
Page({
  data: {
    siteImgSrcObj: {
      "stop": "/images/stop.png",
      "storage": "/images/storage.png",
    },
    siteImg: {},    // 场地图片数据
    carList: [],    // 汽车图片数组，用于渲染页面
    syncScale: 1,   // 同步缩放比例（同步场地与车辆图片的缩放）
    isScale: true,  // 是否支持缩放
    sceneData: {},  // 场景数据
    sceneDataTest: {
      site: 'stop',
      carData: [{
        top: 500,
        left: 100,
        angle: 0,
        scale: 1,
      },{
        top: 100,
        left: 300,
        angle: 180,
        scale: 1,
      },{
        top: 50,
        left: 70,
        angle: 90,
        scale: 1,
      }]
    }
  },
  // 页面初始化
  onLoad: function(options) {
    wx.showLoading({
      title: '正在初始化',
      mask: true
    })
    let sceneData = '{"site":"storage","carData":[{"top":184.09413146972656,"left":77.83524703979492,"angle":-269.3068839085009,"scale":0.7863229469464958},{"top":-34.400299072265625,"left":277.4349060058594,"angle":359.93074208533653,"scale":0.6880014912668356},{"top":0,"left":0,"angle":0,"scale":0.9833729216152018}]}'
    this.data.sceneData = JSON.parse(sceneData)
    // 获取系统信息计算画布宽高
    wx.getSystemInfo({
      success: sysData => {
        this.sysData = sysData
        this.setData({
          canvasWidth: this.sysData.windowWidth * canvasPre,
          canvasHeight: this.sysData.windowHeight * canvasPre,
        })
      }
    });
    this.initSite(this.data.siteImgSrcObj[this.data.sceneData.site])
    setTimeout(() => {
      for(let i = 0; i < this.data.sceneData.carData.length; i++){
        this.initCarImg(this.data.sceneData.carData[i]);
      }
      wx.hideLoading()
    }, 200)
  },
  // 初始化场地数据
  initSite(imgSrc) {
    let data = {}
    wx.getImageInfo({
      src: imgSrc,
      success: res => {
        // 初始化数据
        data.width = res.width; //宽度
        data.height = res.height; //高度
        data.src = imgSrc; //地址
        data.top = 0; //top定位
        data.left = 0; //left定位
        // 图片中心坐标
        data.x = data.left + data.width / 2;
        data.y = data.top + data.height / 2;
        data.scale = 1; //scale缩放
        // 计算最佳缩放
        let scale = 1;
        if(this.sysData.windowWidth <= data.width){
          scale = this.sysData.windowWidth / data.width;
          data.height = data.height * scale
          data.width = this.sysData.windowWidth
        }
        if(this.sysData.windowHeight <= data.height){
          scale = this.sysData.windowHeight / data.height
          data.width = data.width * scale
          data.height = this.sysData.windowHeight
        }
        data.scale = scale
        // console.log(data)
        this.setData({
          siteImg: data,
          syncScale: scale
        })
      }
    })
  },
  // 初始化图片数据
  initCarImg(carData) {
    let data = {}
    wx.getImageInfo({
      src: carImgSrc,
      success: res => {
        // 初始化数据
        data.width = res.width; //宽度
        data.height = res.height; //高度
        data.src = carImgSrc; //地址
        data.id = carId++; //id
        data.top = carData.top || 0; //top定位
        data.left = carData.left || 0; //left定位
        // 图片中心坐标
        data.x = data.left + data.width / 2;
        data.y = data.top + data.height / 2;
        // data.scale = 1; //scale缩放
        data.scale = carData.scale || this.data.syncScale
        // data.oScale = 1; //控件缩放
        data.oScale = 1 / data.scale
        data.angle = carData.angle || 0; //旋转角度
        data.active = false; //选中状态
        // console.log(data)
        cars[cars.length] = data;
        this.setData({
          carList: cars
        })
      }
    })
  },
  // 手指触摸开始（图片）
  WraptouchStart: function(e) {
    // 找到点击的那个图片对象，并记录
    for (let i = 0; i < cars.length; i++) {
      cars[i].active = false;
      if (e.currentTarget.dataset.id == cars[i].id) {
        index = i;
        cars[index].active = true;
      }
    }
    this.setData({
      carList: cars
    })
    // console.log(e)
    // 记录触摸开始坐标
    cars[index].lx = e.touches[0].clientX;
    cars[index].ly = e.touches[0].clientY;
    // console.log(cars[index])
  },
  // 手指触摸移动（图片）
  WraptouchMove(e) {
    // console.log('WraptouchMove', e)
    // 记录移动时触摸的坐标
    cars[index]._lx = e.touches[0].clientX;
    cars[index]._ly = e.touches[0].clientY;
    // 计算图片位置及圆心坐标
    cars[index].left += cars[index]._lx - cars[index].lx;
    cars[index].top += cars[index]._ly - cars[index].ly;
    cars[index].x += cars[index]._lx - cars[index].lx;
    cars[index].y += cars[index]._ly - cars[index].ly;
    // 边界移动阻止
    this.boundaryStop(cars[index]._lx - cars[index].lx, cars[index]._ly - cars[index].ly)
    // 替换当前触摸坐标为触摸开始坐标
    cars[index].lx = e.touches[0].clientX;
    cars[index].ly = e.touches[0].clientY;
    // console.log(cars)
    this.setData({
      carList: cars
    })
  },
  // 移动到边界阻止(参数1：x轴移动的距离；参数2：y轴移动的距离)
  boundaryStop(range_x, range_y) {
    // 如果图片到达边界则回退移动状态（即阻止移动）
    let diff_width =  cars[index].width * (1 - cars[index].scale) / 2
    let diff_height =  cars[index].height * (1 - cars[index].scale) / 2
    if(cars[index].left + diff_width < 0 || cars[index].left + cars[index].width - diff_width > this.sysData.windowWidth){
      cars[index].left -= range_x;
      cars[index].x -= range_x;
      // 横轴超出移动到边缘
      if(cars[index].left + diff_width < 0){
        cars[index].left = -diff_width
        cars[index].x = cars[index].width / 2 - diff_width 
      }else if(cars[index].left + cars[index].width - diff_width > this.sysData.windowWidth){
        cars[index].left = this.sysData.windowWidth - (cars[index].width - diff_width)
        cars[index].x = this.sysData.windowWidth - (cars[index].width / 2 - diff_width) 
      }
    }
    if(cars[index].top + diff_height < 0 || cars[index].top + cars[index].height - diff_height > this.sysData.windowHeight){
      cars[index].top -= range_y;
      cars[index].y -= range_y;
      // 纵轴超出移动到边缘
      if(cars[index].top + diff_height < 0){
        cars[index].top = -diff_height
        cars[index].y = cars[index].height / 2 - diff_height 
      }else if(cars[index].top + cars[index].height - diff_height > this.sysData.windowHeight){
        cars[index].top = this.sysData.windowHeight - (cars[index].height - diff_height)
        cars[index].y = this.sysData.windowHeight - (cars[index].height / 2 - diff_height) 
      }
    }
  },
  // 手指触摸结束
  WraptouchEnd() {
    // this.synthesis()
  },
  // 手指触摸开始（控件）
  oTouchStart(e) {
    // 找到点击的那个图片对象，并记录
    for (let i = 0; i < cars.length; i++) {
      cars[i].active = false;
      if (e.currentTarget.dataset.id == cars[i].id) {
        index = i;
        cars[index].active = true;
      }
    }
    // 记录触摸开始坐标
    cars[index].tx = e.touches[0].clientX;
    cars[index].ty = e.touches[0].clientY;
    // 记录移动开始时的角度
    cars[index].anglePre = this.countDeg(cars[index].x, cars[index].y, cars[index].tx, cars[index].ty)
    // 获取初始图片半径
    cars[index].r = this.getDistance(cars[index].x, cars[index].y, cars[index].left, cars[index].top);
    // console.log(cars[index])
  },
  // 手指触摸移动（控件）
  oTouchMove: function(e) {
    // 记录移动后的位置
    cars[index]._tx = e.touches[0].clientX;
    cars[index]._ty = e.touches[0].clientY;
    // 计算移动后的点到圆心的距离
    cars[index].disPtoO = this.getDistance(cars[index].x, cars[index].y, cars[index]._tx-10, cars[index]._ty - 10)
    if(this.data.isScale){
      let scale = 1
      if(cars[index].disPtoO / cars[index].r < SCALE_MIN){
        scale = SCALE_MIN
      }else if(cars[index].disPtoO / cars[index].r > SCALE_MAX){
        scale = SCALE_MAX
      }else{
        scale = cars[index].disPtoO / cars[index].r
      }
      // 通过上面的值除以图片原始半径获得缩放比例
      cars[index].scale = scale;
      // 控件反向缩放，即相对视口保持原来的大小不变
      cars[index].oScale = 1 / cars[index].scale;
    }
    // 计算移动后位置的角度
    cars[index].angleNext = this.countDeg(cars[index].x, cars[index].y, cars[index]._tx, cars[index]._ty)
    // 计算角度差
    cars[index].new_rotate = cars[index].angleNext - cars[index].anglePre;
    // 计算叠加的角度差
    cars[index].angle += cars[index].new_rotate;
    // 替换当前触摸坐标为触摸开始坐标
    cars[index].tx = e.touches[0].clientX;
    cars[index].ty = e.touches[0].clientY;
    // 更新移动角度
    cars[index].anglePre = this.countDeg(cars[index].x, cars[index].y, cars[index].tx, cars[index].ty)
    // 渲染图片
    this.setData({
      carList: cars
    })
  },
  // 计算两点之间距离
  getDistance(cx, cy, pointer_x, pointer_y) {
    var ox = pointer_x - cx;
    var oy = pointer_y - cy;
    return Math.sqrt(
      ox * ox + oy * oy
    );
  },
  // 计算手指触摸点到圆心的角度
  countDeg: function(cx, cy, pointer_x, pointer_y) {
    var ox = pointer_x - cx;
    var oy = pointer_y - cy;
    var to = Math.abs(ox / oy);
    // console.log(to)
    var angle = Math.atan(to) / (2 * Math.PI) * 360;
    if (ox < 0 && oy < 0){ //相对在左上角，第4象限，按照正常坐标系来
      angle = -angle;
    } else if (ox <= 0 && oy >= 0){ //左下角，第3象限
      angle = -(180 - angle)
    } else if (ox > 0 && oy < 0){ //右上角，第1象限
      angle = angle;
    } else if (ox > 0 && oy > 0){ //右下角，第2象限
      angle = 180 - angle;
    }
    // console.log(angle)
    return angle;
  },
  /* 全局控件部分 */
  // 汽车移动
  carMove(attr, speed) {
    cars[index][attr] += speed
    cars[index][attr == 'left' ? 'x' : 'y'] += speed
    // 边界移动阻止
    this.boundaryStop((attr == 'left' ? speed : 0), (attr == 'top' ? speed : 0))
    this.setData({
      carList: cars
    })
  },
  // 汽车复位
  carReset() {
    cars[index].top = 0;
    cars[index].left = 0;
    cars[index].x = cars[index].left + cars[index].width / 2;
    cars[index].y = cars[index].top + cars[index].height / 2;
    cars[index].scale = this.data.syncScale
    cars[index].oScale = 1 / this.data.syncScale
    cars[index].angle = 0; //旋转角度
    this.setData({
      carList: cars
    })
  },
  // 汽车旋转
  carRotate(attr, speed) {
    cars[index][attr] += speed
    this.setData({
      carList: cars
    })
  },
  /* 汽车控制 */
  // 触控开始
  carActionStart(e) {
    if(cars.length <= 0)  return
    let action = e.currentTarget.dataset.action
    switch(action){
      case 'left':
        clearInterval(this.leftTimer)
        this.leftTimer = setInterval(() => {
          this.carMove('left', -CAR_SPEED)
        }, CAR_SPL)
        break
      case 'right':
        clearInterval(this.rightTimer)
        this.rightTimer = setInterval(() => {
          this.carMove('left', CAR_SPEED)
        }, CAR_SPL)
        break
      case 'up':
        clearInterval(this.upTimer)
        this.upTimer = setInterval(() => {
          this.carMove('top', -CAR_SPEED)
        }, CAR_SPL)
        break
      case 'down':
        clearInterval(this.downTimer)
        this.downTimer = setInterval(() => {
          this.carMove('top', CAR_SPEED)
        }, CAR_SPL)
        break
      case 'rotate_cw':
        clearInterval(this.cwTimer)
        this.cwTimer = setInterval(() => {
          this.carRotate('angle', CAR_SPEED)
        }, CAR_SPL)
        break
      case 'rotate_ccw':
        clearInterval(this.ccwTimer)
        this.ccwTimer = setInterval(() => {
          this.carRotate('angle', -CAR_SPEED)
        }, CAR_SPL)
        break
    }
  },
  // 触控结束
  carActionEnd(e) {
    let action = e.currentTarget.dataset.action
    switch(action){
      case 'left':
        clearInterval(this.leftTimer)
        break
      case 'right':
        clearInterval(this.rightTimer)
        break
      case 'up':
        clearInterval(this.upTimer)
        break
      case 'down':
        clearInterval(this.downTimer)
        break
      case 'rotate_cw':
        clearInterval(this.cwTimer)
        break
      case 'rotate_ccw':
        clearInterval(this.ccwTimer)
        break
    }
  },
  // 点击图片以外隐藏控件
  hideControls(e) {
    // 记录移动后的位置
    let x = e.touches[0].clientX;
    let y = e.touches[0].clientY;
    // 判断是否有图片被选中
    let isActive = false
    for (let i = 0; i < cars.length; i++) {
      if(cars[i].active){
        index = i
        isActive = true
        break
      }
    }
    // 若有图片被选中则当点击图片以外的区域取消选中状态（安全区域扩大10个像素）
    if(isActive && (x < cars[index].left - 10 || x > cars[index].left + cars[index].width + 10||
    y < cars[index].top - 10 || y > cars[index].top + cars[index].height + 10)){
      cars[index].active = false
      this.setData({
        carList: cars
      })
    }
  },
  // 车辆添加
  carAdd() {
    if(cars.length >= CAR_MAX_COUNT){
      wx.showToast({
        title: '车辆数量已达上限！',
        icon: 'none'
      })
      return
    }
    this.initCarImg(carRawData);
  },
  // 删除图片
  deleteCar: function(e) {
    let newList = [];
    for (let i = 0; i < cars.length; i++) {
      if (e.currentTarget.dataset.id != cars[i].id) {
        newList.push(cars[i])
      }
    }
    // 删除图片后选中剩存的图片并保存下标
    if (newList.length > 0) {
      newList[newList.length - 1].active = true;
      index = newList.length - 1
    }
    cars = newList;
    this.setData({
      carList: cars
    })
  },
  // 预览合成图片
  openPreviewContainer () {
    wx.createSelectorQuery().select('#siteImg').boundingClientRect((rect) => {
      this.data.siteImg.left = rect.left   // 节点的左边界坐标
      this.data.siteImg.top = rect.top     // 节点的上边界坐标
    }).exec()
    // 查询位置回调函数表现为异步，因此等待获取坐标，延迟画图
    setTimeout(() => {
      this.synthesis()
    }, 200)
    wx.showLoading({
      title: '正在合成图片',
      mask: true
    })
    setTimeout(() => {
      wx.hideLoading()
      this.setData({
        showCanvas: true
      })
    }, 1000)
  },
  // 合成图片
  synthesis() {
    console.log('合成图片')
    maskCanvas.save();
    maskCanvas.beginPath();
    // 画背景
    maskCanvas.setFillStyle('#fff');
    maskCanvas.fillRect(0, 0, this.data.canvasWidth, this.data.canvasHeight)
    maskCanvas.closePath();
    maskCanvas.stroke();

    // 画场地图片
    let left = this.data.siteImg.left
    let top = this.data.siteImg.top
    let width = this.data.siteImg.width
    let height = this.data.siteImg.height
    maskCanvas.drawImage(this.data.siteImg.src, left, top, width, height);
    /*
     * num为canvas内背景图占canvas的百分比，若全背景num =1
     * prop值为canvas内背景的宽度与可移动区域的宽度的比，如一致，则prop =1;
     */
    // 画汽车
    const num = 1,
      prop = 1 * canvasPre;
    cars.forEach((currentValue, index) => {
      maskCanvas.save();
      maskCanvas.translate(this.data.canvasWidth * (1 - num) / 2, 0);
      maskCanvas.beginPath();
      maskCanvas.translate(currentValue.x * prop, currentValue.y * prop); //圆心坐标
      maskCanvas.rotate(currentValue.angle * Math.PI / 180);
      maskCanvas.translate(-(currentValue.width * currentValue.scale * prop / 2), -(currentValue.height * currentValue.scale * prop / 2))
      maskCanvas.drawImage(currentValue.src, 0, 0, currentValue.width * currentValue.scale * prop, currentValue.height * currentValue.scale * prop);
      maskCanvas.restore();
    })
    maskCanvas.draw(false, (e) => {
      wx.canvasToTempFilePath({
        canvasId: 'maskCanvas',
        success: res => {
          console.log('draw success')
          console.log(res.tempFilePath)
          this.setData({
            previewImg: res.tempFilePath
          })
        }
      }, this)
    })
  },
  // 关闭预览
  closePreviewContainer() {
    this.setData({
      showCanvas: false
    })
  },
  // 保存图片
  saveImg() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.previewImg,
      success: res => {
        wx.showToast({
          title: '保存成功',
          icon: "success"
        })
        this.closePreviewContainer()
      },
      fail: res => {
        console.log(res)
        wx.openSetting({
          success: settingdata => {
            console.log(settingdata)
            if (settingdata.authSetting['scope.writePhotosAlbum']) {
              wx.showToast({
                title: '获取权限成功\n请重新保存图片',
                icon: 'none'
              })
            } else {
              wx.showToast({
                title: '获取权限失败\n若需要保存图片请先授权',
                icon: 'none'
              })
            }
          },
          fail: error => {
            console.log(error)
          }
        })
        wx.showModal({
          title: '提示',
          content: '保存失败，请确保相册权限已打开',
        })
      }
    })
  },
  // 保存场景数据
  saveSceneData() {
    let sceneData = {}
    sceneData.site = this.data.sceneData.site
    sceneData.carData = []
    for(let i = 0; i < this.data.carList.length; i++){
      sceneData.carData[i] = {}
      sceneData.carData[i].top = this.data.carList[i].top
      sceneData.carData[i].left = this.data.carList[i].left
      sceneData.carData[i].angle = this.data.carList[i].angle
      sceneData.carData[i].scale = this.data.carList[i].scale
    }
    console.log(JSON.stringify(sceneData))
  }
})