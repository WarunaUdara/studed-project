//go:build windows

package coderun

import "os/exec"

// Windows does not expose Unix process groups through syscall. Process.Kill
// still enforces the request deadline for the interpreter itself.
func configureProcess(cmd *exec.Cmd) {
	cmd.Cancel = func() error {
		if cmd.Process == nil {
			return nil
		}
		return cmd.Process.Kill()
	}
}
