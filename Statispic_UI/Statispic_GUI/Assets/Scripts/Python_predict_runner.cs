using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Diagnostics;
using UnityEngine.SceneManagement;

public class ImageDir
{
    public static string best_image_dir = "";  // This is reachable from everywhere and can use within the next scene
}
public class Python_predict_runner : MonoBehaviour
{
    public static void run_cmd(string cmd, string args)
    {
        string bestImageDir = "";
        ProcessStartInfo start = new ProcessStartInfo();
        start.FileName = "C:/Users/tomer/AppData/Local/Programs/Python/Python36/python.exe"; //Where the python.exe is found
        start.Arguments = string.Format("{0} {1}", cmd, args); // Putting all of the cmd line together with args and command
        start.UseShellExecute = false;
        start.RedirectStandardOutput = true;
        start.CreateNoWindow = true;  // For now showing the cmd window
        Process process = new Process();
        process.StartInfo.UseShellExecute = false;
        process.StartInfo = start;
        process.Start();
        process.StartInfo.RedirectStandardOutput = true;
        while (!process.StandardOutput.EndOfStream)
        {
            bestImageDir = process.StandardOutput.ReadLine(); // Getting the output of the ML_Client.py predict. It will contain the path to the best image.
        }
        UnityEngine.Debug.Log("The best image dir is: " + bestImageDir);
        ImageDir.best_image_dir = bestImageDir;  // Putting it in the public class which has a static variable (can be accessed in another script, using in ChangeText).
        process.WaitForExit(); 
    }


    IEnumerator WaitThenCall()
    {
        string ML_ClientScriptPath = "./Assets/Python_Scripts/ML_Client.py"; // For running locally (in unity, exe version)
        yield return new WaitForSeconds(1f);
        UnityEngine.Debug.Log("Calling the python script");
        //run_cmd("D:/Statispic2/Server_and_client/ML_Client.py", "");  // For running the not exe version.
        run_cmd(ML_ClientScriptPath, "");  // For running locally (in unity, exe version)
        UnityEngine.Debug.Log("Finished the python script");
        SceneManager.LoadScene(sceneNamee); // Changing to the predict result screen
    }

    string sceneNamee = "PredictResult"; // Containing the next scene name (the one that displays the best image path).
    void Start()
    {
        StartCoroutine(WaitThenCall()); // Doing it this way so that it would call the python script before changing the scene.
    }

}
