import { Shader3D } from "../../../RenderEngine/RenderShader/Shader3D";
import { CommandUniformMap } from "../../DriverDesign/RenderDevice/CommandUniformMap";
import { ShaderDataType } from "../../DriverDesign/RenderDevice/ShaderData";
export class WebGLCommandUniformMap extends CommandUniformMap {

    _idata: Map<number, {
        propertyName: string,
        arrayLength: number, //兼容WGSL
        uniformtype: ShaderDataType,
    }> = new Map();

    _stateName: string;
    _stateID: number = 0;

    constructor(stateName: string) {
        super(stateName);
        this._stateName = stateName;
        this._stateID = Shader3D.propertyNameToID(stateName);
    }

    hasPtrID(propertyID: number): boolean {
        return this._stateID == propertyID || this._idata.has(propertyID);
    }

    /**
     * 增加一个Uniform参数，如果Uniform属性是Array，请使用addShaderUniformArray
     * @internal
     * @param propertyID 
     * @param propertyKey 
     */
    addShaderUniform(propertyID: number, propertyKey: string, uniformtype: ShaderDataType): void {
        this._idata.set(propertyID, { uniformtype: uniformtype, propertyName: propertyKey, arrayLength: 0 });
    }

    /**
     * 增加一个UniformArray参数
     * @internal
     * @param propertyID 
     * @param propertyName 
     */
    addShaderUniformArray(propertyID: number, propertyName: string, uniformtype: ShaderDataType, arrayLength: number): void {
        if (uniformtype !== ShaderDataType.Matrix4x4 && uniformtype !== ShaderDataType.Vector4)
            throw ('because of align rule, the engine does not support other types as arrays.');
        this._idata.set(propertyID, { uniformtype, propertyName, arrayLength });
    } //兼容WGSL

}