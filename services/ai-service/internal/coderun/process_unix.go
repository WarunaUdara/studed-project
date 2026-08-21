//go:build !windows

package coderun

import (
	"os/exec"
	"syscall"
)

// configureProcess gives the child its own process group so a runaway student
// program cannot leave descendants behind after the request deadline.
func configureProcess(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	cmd.Cancel = func() error {
		if cmd.Process == nil {
			return nil
		}
		return syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
	}
}
