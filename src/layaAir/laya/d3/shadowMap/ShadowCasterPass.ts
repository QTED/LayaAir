import { LayaGL } from "../../layagl/LayaGL";
import { ShaderDataType } from "../../RenderDriver/DriverDesign/RenderDevice/ShaderData";
import { Shader3D } from "../../RenderEngine/RenderShader/Shader3D";
import { RenderTexture } from "../../resource/RenderTexture";
import { DirectionLightCom } from "../core/light/DirectionLightCom";
import { ShadowCascadesMode } from "../core/light/ShadowCascadesMode";
import { ShadowMapFormat, ShadowUtils } from "../core/light/ShadowUtils";
import { SpotLightCom } from "../core/light/SpotLightCom";

/**
 * @internal
 * <code>ShadowCasterPass</code> 类用于实现阴影渲染管线
 */
export class ShadowCasterPass {
    /** @internal */
    static SHADOW_BIAS: number;
    /** @internal */
    static SHADOW_LIGHT_DIRECTION: number;
    /** @internal */
    static SHADOW_SPLIT_SPHERES: number;
    /** @internal */
    static SHADOW_MATRICES: number;
    /** @internal */
    static SHADOW_MAP_SIZE: number;
    /** @internal */
    static SHADOW_MAP: number;
    /** @internal */
    static SHADOW_PARAMS: number;
    /** @internal */
    static SHADOW_SPOTMAP_SIZE: number;
    /** @internal */
    static SHADOW_SPOTMAP: number;
    /** @internal */
    static SHADOW_SPOTMATRICES: number;

    /**
     * @internal
     * init Scene UniformMap
     */
    static __init__() {
        ShadowCasterPass.SHADOW_BIAS = Shader3D.propertyNameToID("u_ShadowBias");
        ShadowCasterPass.SHADOW_LIGHT_DIRECTION = Shader3D.propertyNameToID("u_ShadowLightDirection");
        ShadowCasterPass.SHADOW_SPLIT_SPHERES = Shader3D.propertyNameToID("u_ShadowSplitSpheres");
        ShadowCasterPass.SHADOW_MATRICES = Shader3D.propertyNameToID("u_ShadowMatrices");
        ShadowCasterPass.SHADOW_MAP_SIZE = Shader3D.propertyNameToID("u_ShadowMapSize");
        ShadowCasterPass.SHADOW_MAP = Shader3D.propertyNameToID("u_ShadowMap");
        ShadowCasterPass.SHADOW_PARAMS = Shader3D.propertyNameToID("u_ShadowParams");
        ShadowCasterPass.SHADOW_SPOTMAP_SIZE = Shader3D.propertyNameToID("u_SpotShadowMapSize");
        ShadowCasterPass.SHADOW_SPOTMAP = Shader3D.propertyNameToID("u_SpotShadowMap");
        ShadowCasterPass.SHADOW_SPOTMATRICES = Shader3D.propertyNameToID("u_SpotViewProjectMatrix");

        const sceneUniformMap = LayaGL.renderDeviceFactory.createGlobalUniformMap("Scene3D");

        sceneUniformMap.addShaderUniform(ShadowCasterPass.SHADOW_BIAS, "u_ShadowBias", ShaderDataType.Vector4);
        sceneUniformMap.addShaderUniform(ShadowCasterPass.SHADOW_LIGHT_DIRECTION, "u_ShadowLightDirection", ShaderDataType.Vector3);

        //sceneUniformMap.addShaderUniform(ShadowCasterPass.SHADOW_SPLIT_SPHERES, "u_ShadowSplitSpheres", ShaderDataType.Vector4);
        //sceneUniformMap.addShaderUniform(ShadowCasterPass.SHADOW_MATRICES, "u_ShadowMatrices", ShaderDataType.Matrix4x4);
        //scene和camera的uniformMap必须指明数组长度，因为数组信息不从shader中提取，直接使用map中的信息
        sceneUniformMap.addShaderUniformArray(ShadowCasterPass.SHADOW_SPLIT_SPHERES, "u_ShadowSplitSpheres", ShaderDataType.Vector4, 4); //兼容WGSL
        sceneUniformMap.addShaderUniformArray(ShadowCasterPass.SHADOW_MATRICES, "u_ShadowMatrices", ShaderDataType.Matrix4x4, 4); //兼容WGSL
        sceneUniformMap.addShaderUniform(ShadowCasterPass.SHADOW_MAP_SIZE, "u_ShadowMapSize", ShaderDataType.Vector4);
        sceneUniformMap.addShaderUniform(ShadowCasterPass.SHADOW_MAP, "u_ShadowMap", ShaderDataType.Texture2D);
        sceneUniformMap.addShaderUniform(ShadowCasterPass.SHADOW_PARAMS, "u_ShadowParams", ShaderDataType.Vector4);
        sceneUniformMap.addShaderUniform(ShadowCasterPass.SHADOW_SPOTMAP_SIZE, "u_SpotShadowMapSize", ShaderDataType.Vector4);
        sceneUniformMap.addShaderUniform(ShadowCasterPass.SHADOW_SPOTMAP, "u_SpotShadowMap", ShaderDataType.Texture2D);
        sceneUniformMap.addShaderUniform(ShadowCasterPass.SHADOW_SPOTMATRICES, "u_SpotViewProjectMatrix", ShaderDataType.Matrix4x4);
        //sceneUniformMap.addShaderUniform(Shader3D.propertyNameToID(UniformBufferObject.UBONAME_SHADOW), UniformBufferObject.UBONAME_SHADOW);
    }

    /** @internal */
    private _shadowDirectLightMap: RenderTexture;
    /** @internal */
    private _shadowSpotLightMap: RenderTexture;

    constructor() {

    }

    getDirectLightShadowMap(light: DirectionLightCom) {
        var shadowMapWidth;
        var shadowMapHeight;
        var atlasResolution: number = light.shadowResolution;
        var cascadesMode: ShadowCascadesMode = light.shadowCascadesMode;
        var cascadesCount: number;
        var shadowTileResolution: number;
        if (cascadesMode == ShadowCascadesMode.NoCascades) {
            shadowTileResolution = atlasResolution;
            shadowMapWidth = atlasResolution;
            shadowMapHeight = atlasResolution;
        }
        else {
            cascadesCount = cascadesMode == ShadowCascadesMode.TwoCascades ? 2 : 4;
            shadowTileResolution = ShadowUtils.getMaxTileResolutionInAtlas(atlasResolution, atlasResolution, cascadesCount);
            shadowMapWidth = shadowTileResolution * 2;
            shadowMapHeight = cascadesMode == ShadowCascadesMode.TwoCascades ? shadowTileResolution : shadowTileResolution * 2;
        }
        this._shadowDirectLightMap && RenderTexture.recoverToPool(this._shadowDirectLightMap);
        this._shadowDirectLightMap = ShadowUtils.getTemporaryShadowTexture(shadowMapWidth, shadowMapHeight, ShadowMapFormat.bit16);
        return this._shadowDirectLightMap;
    }

    getSpotLightShadowPassData(light: SpotLightCom) {
        this._shadowSpotLightMap && RenderTexture.recoverToPool(this._shadowSpotLightMap);
        var shadowResolution: number = light.shadowResolution;
        var shadowMapWidth = shadowResolution;
        var shadowMapHeight = shadowResolution;
        this._shadowSpotLightMap = ShadowUtils.getTemporaryShadowTexture(shadowMapWidth, shadowMapHeight, ShadowMapFormat.bit16);
        return this._shadowSpotLightMap;
    }

    getPointLightShadowPassData() {
        //TODO
    }

    /**
     * 清理阴影数据
     * @internal
     */
    cleanUp(): void {
        this._shadowDirectLightMap && RenderTexture.recoverToPool(this._shadowDirectLightMap);
        this._shadowSpotLightMap && RenderTexture.recoverToPool(this._shadowSpotLightMap);
        this._shadowDirectLightMap = null;
        this._shadowSpotLightMap = null;
    }
}

