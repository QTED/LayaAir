import { ShaderDataType } from "../../RenderDriver/DriverDesign/RenderDevice/ShaderData";
import { ShaderDefine } from "../../RenderDriver/RenderModuleData/Design/ShaderDefine";
import { RenderTargetFormat } from "../../RenderEngine/RenderEnum/RenderTargetFormat";
import { Shader3D } from "../../RenderEngine/RenderShader/Shader3D";
import { LayaGL } from "../../layagl/LayaGL";
import { Vector4 } from "../../maths/Vector4";
import { Viewport } from "../../maths/Viewport";
import { DepthTextureMode, RenderTexture } from "../../resource/RenderTexture";
import { Camera } from "../core/Camera";

/**
 * <code>ShadowCasterPass</code> 类用于实现阴影渲染管线
 */
export class DepthPass {
    static SHADOW_BIAS: Vector4 = new Vector4();
    /** @internal */
    static DEPTHPASS: ShaderDefine;
    /** @internal */
    static DEFINE_SHADOW_BIAS: number;
    /**@internal */
    static DEPTHTEXTURE: number;
    /**@internal */
    static DEPTHNORMALSTEXTURE: number;
    /**@internal */
    static DEPTHZBUFFERPARAMS: number;

    private _zBufferParams: Vector4;

    static __init__() {
        DepthPass.DEPTHPASS = Shader3D.getDefineByName("DEPTHPASS");
        DepthPass.DEFINE_SHADOW_BIAS = Shader3D.propertyNameToID("u_ShadowBias");
        DepthPass.DEPTHTEXTURE = Shader3D.propertyNameToID("u_CameraDepthTexture");
        DepthPass.DEPTHNORMALSTEXTURE = Shader3D.propertyNameToID("u_CameraDepthNormalsTexture");
        DepthPass.DEPTHZBUFFERPARAMS = Shader3D.propertyNameToID("u_ZBufferParams");
    }

    /**@internal */
    private _depthTexture: RenderTexture;
    /**@internal */
    private _depthNormalsTexture: RenderTexture;
    /**@internal */
    private _viewPort: Viewport;
    /**@internal */
    private _camera: Camera;

    constructor() {

    }

    /**
     * 渲染深度更新
     * @param camera 
     * @param depthType 
     */
    getTarget(camera: Camera, depthType: DepthTextureMode, depthTextureFormat: RenderTargetFormat): void {
        this._viewPort = camera.viewport;
        this._camera = camera;
        switch (depthType) {
            case DepthTextureMode.Depth:
                camera.depthTexture = this._depthTexture = RenderTexture.createFromPool(this._viewPort.width, this._viewPort.height, depthTextureFormat, RenderTargetFormat.None, false, 1);
                break;
            case DepthTextureMode.DepthNormals:
                camera.depthNormalTexture = this._depthNormalsTexture = RenderTexture.createFromPool(this._viewPort.width, this._viewPort.height, RenderTargetFormat.R8G8B8A8, depthTextureFormat, false, 1);
                break;
            case DepthTextureMode.MotionVectors:
                //TODO：
                break;
            default:
                throw ("there is UnDefined type of DepthTextureMode")
        }
    }

    /**
    *
    * 渲染完后传入使用的参数
    * @internal
    */
    _setupDepthModeShaderValue(depthType: DepthTextureMode, camera: Camera) {
        switch (depthType) {
            case DepthTextureMode.Depth:
                var far = camera.farPlane;
                var near = camera.nearPlane;
                this._zBufferParams.setValue(1.0 - far / near, far / near, (near - far) / (near * far), 1 / near);
                camera._shaderValues.setVector(DepthPass.DEFINE_SHADOW_BIAS, DepthPass.SHADOW_BIAS);
                camera._shaderValues.setTexture(DepthPass.DEPTHTEXTURE, this._depthTexture);
                camera._shaderValues.setVector(DepthPass.DEPTHZBUFFERPARAMS, this._zBufferParams);
                break;
            default:
                throw ("there is UnDefined type of DepthTextureMode")
        }
    }

    /**
     * 清理深度数据
     * @internal
     */
    cleanUp(): void {
        (this._depthTexture instanceof RenderTexture) && this._depthTexture && RenderTexture.recoverToPool(this._depthTexture);
        this._depthNormalsTexture && RenderTexture.recoverToPool(this._depthNormalsTexture);
        this._depthTexture = null;
        this._depthNormalsTexture = null;
    }
}

