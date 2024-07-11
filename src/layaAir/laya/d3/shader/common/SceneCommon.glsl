#if !defined(SceneCommon_lib)
    #define SceneCommon_lib

#ifdef ENUNIFORMBLOCK
    uniform Scene3D {
        vec4 u_FogColor;
        vec4 u_Fogparams;
        float u_Time;
        int u_DirationLightCount;
        float u_GIRotate;
        vec4 u_ShadowBias; // x: depth bias, y: normal bias
        vec3 u_ShadowLightDirection;
        vec4 u_ShadowSplitSpheres[4];
        mat4 u_ShadowMatrices[4];
        vec4 u_ShadowMapSize;
        vec4 u_ShadowParams;
        vec4 u_SpotShadowMapSize;
        mat4 u_SpotViewProjectMatrix;
    };
#else // ENUNIFORMBLOCK
    uniform vec4 u_FogColor;
    uniform vec4 u_Fogparams;
    uniform float u_Time;
    uniform int u_DirationLightCount;
    uniform float u_GIRotate;
    uniform vec4 u_ShadowBias; // x: depth bias, y: normal bias
    uniform vec3 u_ShadowLightDirection;
    uniform mat4 u_ShadowMatrices[4];
    uniform vec4 u_ShadowSplitSpheres[4];
    uniform vec4 u_ShadowMapSize;
    uniform vec4 u_ShadowParams;
    uniform vec4 u_SpotShadowMapSize;
    uniform mat4 u_SpotViewProjectMatrix;
#endif // ENUNIFORMBLOCK

#endif // SceneCommon_lib